import {
  extractTextFromPDF,
  chunkText,
  embedChunks,
} from "@/service/pdfService";
import { getFileFromS3 } from "@/service/s3Service";
import { upsertData } from "@/service/uploadService";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import "../../../../logger";
import { MAX_TOKEN_THRESHOLD } from "@/app/utils/constants";

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

    const { text, tokenCount } = await extractTextFromPDF(pdfBuffer);

    await prisma.document.update({
      where: { slug: id },
      data: { extractedText: text },
    });

    if (tokenCount > Number(MAX_TOKEN_THRESHOLD)) {
      const chunkOutputs = await chunkText(text, 1);
      console.log("Chunk outputs:", JSON.stringify(chunkOutputs, null, 4));
      const embeddedChunks = await embedChunks(chunkOutputs);

      await upsertData(embeddedChunks, id);

      await prisma.document.update({
        where: { slug: id },
        data: { embeddingsGenerated: true },
      });
    } else {
      console.log("Document under token threshold. Skipping embedding.");
    }
    return NextResponse.json(
      { message: "Document processed successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Internal server error.", error: String(error) },
      { status: 500 },
    );
  }
}
