import { NextResponse } from "next/server";
import { MainAgent } from "@/agents/main-agent";
import { getFileFromS3 } from "@/service/s3Service";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Document ID is required." },
        { status: 400 },
      );
    }

    const document = await prisma.document.findUnique({
      where: { slug: id },
      select: { objectKey: true, embeddingsGenerated: true },
    });

    if (!document) {
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

    const agent = new MainAgent({ name: "DocumentProcessor" });
    const result = await agent.execute({
      action: "process_document",
      documentId: id,
      pdfBuffer: pdfBuffer,
    });

    if (result.status === "error") {
      console.error("Document processing agent error:", result.error);
      return NextResponse.json(
        { message: "Document processing failed.", error: result.error },
        { status: 500 },
      );
    }

    console.log("Document processing agent finished:", result.data);
    return NextResponse.json(
      {
        message:
          result.data?.message || "Document processing initiated successfully.",
        result: result.data,
      },
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
