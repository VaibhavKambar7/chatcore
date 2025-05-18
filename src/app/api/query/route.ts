import prisma from "@/lib/prisma";
import {
  generateContextualLLMResponse,
  generatePureLLMResponse,
} from "@/service/llmService";
import { extractTextFromPDF } from "@/service/pdfService";
import { queryDB } from "@/service/queryService";
import { getFileFromS3 } from "@/service/s3Service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, history, documentId } = await req.json();

    if (!query) {
      return NextResponse.json(
        { message: "Query is required." },
        { status: 400 },
      );
    }

    const document = await prisma.document.findUnique({
      where: {
        slug: documentId,
      },
    });

    let llmResponse;

    if (document?.embeddingsGenerated) {
      const context = await queryDB(query, documentId);
      llmResponse = await generateContextualLLMResponse(
        query,
        context,
        history,
      );
    } else {
      const text = document?.extractedText ?? "";

      llmResponse = await generatePureLLMResponse(query, text, history);
    }

    const chatHistory = document?.chatHistory || [];

    const updatedHistory = [
      ...chatHistory,
      { role: "user", content: query },
      { role: "assistant", content: llmResponse },
    ].filter((item) => item !== null);

    await prisma.document.update({
      where: { slug: documentId },
      data: { chatHistory: updatedHistory },
    });

    return NextResponse.json({
      response: llmResponse,
      status: 200,
    });
  } catch (error) {
    console.log("Error", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
