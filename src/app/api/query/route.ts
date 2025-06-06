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
            try {
              const context = await queryDB(query, documentId);
              // Check if context is the specific "no results" string or empty
              if (
                context === "No matching results found to construct context." ||
                !context.trim()
              ) {
                const noContextMessage =
                  "I couldn't find specific context in the document for your query. I'll try to answer more generally based on the document's full text if available:\n\n";
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ chunk: noContextMessage })}\n\n`,
                  ),
                );
                fullResponse += noContextMessage;
                await generatePureLLMResponseStream(
                  query,
                  document.extractedText ?? "",
                  history,
                  onChunk,
                );
              } else {
                await generateContextualLLMResponseStream(
                  query,
                  context,
                  history,
                  onChunk,
                );
              }
            } catch (dbError) {
              console.error("Error querying DB for context:", dbError);
              const dbErrorMessage =
                dbError instanceof Error
                  ? dbError.message
                  : "Failed to retrieve context from document.";
              const userMessage = `Sorry, I encountered an issue retrieving specific information from the document (${dbErrorMessage}). I can try to answer more generally based on the document's full text if available.\n\n`;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ chunk: userMessage })}\n\n`,
                ),
              );
              fullResponse += userMessage;
              await generatePureLLMResponseStream(
                query,
                document.extractedText ?? "",
                history,
                onChunk,
              );
            }
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
