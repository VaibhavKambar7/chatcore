import prisma from "@/lib/prisma";
import { generateLLMResponse } from "@/service/llmService";
import { queryDB } from "@/service/queryService";
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

    const context = await queryDB(query, documentId);

    const llmResponse = await generateLLMResponse(query, context, history);

    const document = await prisma.document.findUnique({
      where: {
        slug: documentId,
      },
    });

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
