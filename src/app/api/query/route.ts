import { NextResponse } from "next/server";
import { MainAgent } from "@/agents/main-agent";
import { ChatHistory } from "@/service/llmService";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { query, documentId, useWebSearch } = await req.json();

    if (!query || !documentId) {
      return NextResponse.json(
        { message: "Query and Document ID are required." },
        { status: 400 },
      );
    }

    const document = await prisma.document.findUnique({
      where: { slug: documentId },
      select: { chatHistory: true },
    });

    const existingChatHistory: ChatHistory = (document?.chatHistory ||
      []) as ChatHistory;

    const agent = new MainAgent({ name: "QueryResponder" });

    let fullCollectedResponseForHistory = "";

    const clientFacingStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const onChunkCallback = (chunk: string) => {
          fullCollectedResponseForHistory += chunk;
          const sseFormattedChunk = `data: ${JSON.stringify({ chunk: chunk })}\n\n`;
          controller.enqueue(encoder.encode(sseFormattedChunk));
        };

        try {
          const result = await agent.execute({
            action: "answer_query",
            query: query,
            chat_history: existingChatHistory,
            documentId: documentId,
            metadata: { onChunkCallback: onChunkCallback },
            useWebSearch: useWebSearch,
          });

          if (result.status === "error") {
            console.error(
              "Agent workflow error during streaming:",
              result.error,
            );
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: result.error || "Agent failed to generate response." })}\n\n`,
              ),
            );
          }
        } catch (agentError) {
          console.error(
            "Unhandled error during agent execution in stream:",
            agentError,
          );
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: agentError instanceof Error ? agentError.message : String(agentError) })}\n\n`,
            ),
          );
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new NextResponse(clientFacingStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in API route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Internal server error.", error: errorMessage },
      { status: 500 },
    );
  }
}
