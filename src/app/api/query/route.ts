import prisma from "@/lib/prisma";
import {
  generateContextualLLMResponseStream,
  generatePureLLMResponseStream,
} from "@/service/llmService";
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

    const document = await prisma.document.findUnique({
      where: {
        slug: documentId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          const onChunk = (chunk: string) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
            );
            fullResponse += chunk;
          };

          if (document.embeddingsGenerated) {
            const context = await queryDB(query, documentId);
            await generateContextualLLMResponseStream(
              query,
              context,
              history,
              onChunk,
            );
          } else {
            const text = document.extractedText ?? "";
            await generatePureLLMResponseStream(query, text, history, onChunk);
          }

          const chatHistory = document?.chatHistory ?? [];
          const updatedHistory = [
            ...chatHistory,
            { role: "user", content: query },
            { role: "assistant", content: fullResponse },
          ].filter((item) => item !== null);

          await prisma.document.update({
            where: { slug: documentId },
            data: { chatHistory: updatedHistory },
          });

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
    console.log("Error", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
