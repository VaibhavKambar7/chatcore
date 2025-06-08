import {
  extractTextFromPDF,
  chunkText,
  embedChunks,
  ChunkType,
  PageContent,
} from "@/service/pdfService";
import { getFileFromS3 } from "@/service/s3Service";
import { upsertData } from "@/service/uploadService";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import "../../../../logger";
import { MAX_TOKEN_THRESHOLD } from "@/app/utils/constants";
import nlp from "compromise";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "id is required." }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { slug: id },
      select: {
        objectKey: true,
        fileName: true,
        embeddingsGenerated: true,
      },
    });

    if (!document) {
      console.log("Document not found for ID:", id);
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 },
      );
    }

    if (document.embeddingsGenerated) {
      console.log("Document already processed. Skipping.");
      return NextResponse.json(
        { message: "Document already processed." },
        { status: 200 },
      );
    }

    const pdfBuffer = await getFileFromS3(document.objectKey);

    const { pagesData, totalPages, tokenCount, rawExtractedText } =
      await extractTextFromPDF(pdfBuffer);

    console.log(
      "Extracting text from PDF...",
      pagesData,
      "Total pages:",
      totalPages,
      "Token count:",
      tokenCount,
    );

    await prisma.document.update({
      where: { slug: id },
      data: { extractedText: rawExtractedText },
    });

    let allFinalChunks = [];
    let globalChunkIndexCounter = 0;

    if (tokenCount > Number(MAX_TOKEN_THRESHOLD)) {
      console.log(
        `Token count (${tokenCount}) exceeds threshold (${MAX_TOKEN_THRESHOLD}). Chunking document.`,
      );

      for (const page of pagesData) {
        const { text: pageTextContent, pageNumber: currentPageNumber } = page;

        const preChunksFromPage = await chunkText(
          pageTextContent,
          totalPages,
          currentPageNumber,
        );

        for (const preChunk of preChunksFromPage) {
          let currentChunkContext = "";
          if (allFinalChunks.length > 0) {
            const previousGlobalChunk =
              allFinalChunks[allFinalChunks.length - 1];
            const prevSentences =
              (nlp(previousGlobalChunk.text)
                .sentences()
                .out("array") as string[]) || [];
            if (prevSentences.length > 0) {
              currentChunkContext =
                prevSentences[prevSentences.length - 1].trim();
            }
          }

          const finalChunk = {
            id: `chunk-${globalChunkIndexCounter}`,
            text: preChunk.text,
            metadata: {
              totalPages: preChunk.metadata.totalPages,
              pageNumber: preChunk.metadata.pageNumber,
              chunkIndex: `${globalChunkIndexCounter}`,
              context: currentChunkContext,
            },
          };
          allFinalChunks.push(finalChunk);
          globalChunkIndexCounter++;
        }
      }

      console.log("Total finalized chunks generated:", allFinalChunks.length);

      if (allFinalChunks.length > 0) {
        const embeddedChunks = await embedChunks(allFinalChunks);
        await upsertData(embeddedChunks, id);

        await prisma.document.update({
          where: { slug: id },
          data: { embeddingsGenerated: true },
        });
        console.log("Document chunked, embedded, and upserted successfully.");
      } else {
        console.log(
          "No chunks were generated for this document. Skipping embedding and upsert.",
        );
        await prisma.document.update({
          where: { slug: id },
          data: { embeddingsGenerated: false },
        });
      }
    } else {
      console.log(
        `Document token count (${tokenCount}) is within/under threshold. Skipping chunking and embedding.`,
      );
      await prisma.document.update({
        where: { slug: id },
        data: { embeddingsGenerated: false },
      });
    }

    return NextResponse.json(
      { message: "Document processing finished." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in API route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Internal server error.", error: errorMessage },
      { status: 500 },
    );
  }
}
