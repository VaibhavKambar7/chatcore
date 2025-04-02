import {
  extractTextFromPDF,
  chunkText,
  embedChunks,
} from "@/service/pdfService";
import { getFileFromS3 } from "@/service/s3Service";
import { upsertData } from "@/service/uploadService";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      },
    });

    if (!document) {
      console.log("Document not found for ID:", id);
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 }
      );
    }

    const pdfBuffer = await getFileFromS3(document.objectKey);

    const { text, totalPages } = await extractTextFromPDF(pdfBuffer);
    const chunkOutputs = await chunkText(text, totalPages);
    const embeddedChunks = await embedChunks(chunkOutputs);

    await upsertData(embeddedChunks, id);

    return NextResponse.json(
      { message: "Document processed successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Internal server error.", error: String(error) },
      { status: 500 }
    );
  }
}
