import prisma from "@/lib/prisma";
import { generateSummaryAndQuestions } from "@/service/llmService";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Document ID is required" },
        { status: 400 },
      );
    }

    const document = await prisma.document.findUnique({
      where: { slug: id },
      select: { extractedText: true },
    });

    if (!document || !document.extractedText) {
      return NextResponse.json(
        { message: "Document or text not found" },
        { status: 404 },
      );
    }

    const { summary, questions } = await generateSummaryAndQuestions(
      document.extractedText,
    );

    await prisma.document.update({
      where: { slug: id },
      data: {
        chatHistory: [
          {
            role: "assistant",
            content: summary,
          },
        ],
      },
    });

    return NextResponse.json({ summary, questions });
  } catch (error) {
    console.error("Error in /api/getSummaryAndQuestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
