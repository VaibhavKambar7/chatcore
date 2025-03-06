import { extractTextFromPDF } from "@/service/pdfService";
import { getFileFromS3 } from "@/service/s3Service";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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

    const { objectKey, fileName } = document;
    console.log(objectKey, fileName);

    const pdfBuffer = await getFileFromS3(objectKey);

    if (!pdfBuffer || !pdfBuffer) {
      console.log("Failed to retrieve file from S3");
      return NextResponse.json(
        { message: "Failed to retrieve file from S3." },
        { status: 500 }
      );
    }

    const extractedText = await extractTextFromPDF(pdfBuffer);

    return NextResponse.json(extractedText);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Internal server error.", error: String(error) },
      { status: 500 }
    );
  }
}
