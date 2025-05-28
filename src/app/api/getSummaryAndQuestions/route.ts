import prisma from "@/lib/prisma";
import {
  generateSummaryOnly,
  generateQuestionsOnly,
} from "@/service/llmService";
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullSummary = "";

        try {
          const onSummaryChunk = (chunk: string) => {
            console.log("Sending chunk:", chunk);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ summaryChunk: chunk })}\n\n`,
              ),
            );
            fullSummary += chunk;
          };

          console.log("Starting summary generation...");
          await generateSummaryOnly(
            document.extractedText ?? "",
            onSummaryChunk,
          );
          console.log(
            "Summary generation complete. Full summary length:",
            fullSummary.length,
          );

          console.log("Starting questions generation...");
          const questions = await generateQuestionsOnly(
            document.extractedText ?? "",
          );
          console.log("Questions generated:", questions);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ questions })}\n\n`),
          );

          await prisma.document.update({
            where: { slug: id },
            data: {
              chatHistory: [
                {
                  role: "assistant",
                  content: fullSummary,
                },
              ],
            },
          });

          console.log("Sending [DONE] signal");
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`,
            ),
          );
          console.error("Streaming error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in /api/getSummaryAndQuestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
