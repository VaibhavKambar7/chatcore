import { Node, AgentState } from "../../agents/types";
import { toolManager } from "../../tools/tool-manager";
import prisma from "@/lib/prisma";
import { ChatHistory } from "@/service/llmService";

export const reasoningNode = (): Node => ({
  id: "reasoning",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Reasoning Node (Response Generation) ---");
    console.log("Reasoning Node: State received:", {
      input_query: state.input_query,
      documentId: state.metadata?.documentId,
      status: state.status,
      plannerDecision: state.metadata?.planner_decision,
      contextAvailable: !!state.data?.context,
      fullDocumentTextAvailable: !!state.data?.fullDocumentText,
      onChunkCallbackPresent: !!state.metadata?.onChunkCallback,
    });

    try {
      const query = state.input_query;
      const history = state.chat_history || [];
      const documentId = state.metadata?.documentId;
      const onChunkCallback = state.metadata?.onChunkCallback;
      const plannerDecision = state.metadata?.planner_decision;
      const context = state.data?.context;
      const fullDocumentText = state.data?.fullDocumentText;

      if (!query || !documentId || !onChunkCallback || !plannerDecision) {
        console.error(
          "Reasoning Node: Missing essential parameters (query, documentId, onChunkCallback, or plannerDecision).",
        );
        return {
          ...state,
          status: "error" as const,
          error:
            "Reasoning node requires an input query, documentId, streaming callback, and a planner decision.",
          current_node: "reasoning",
          next_node: "error",
        };
      }

      let llmToolUsed = "";
      let collectedResponse = "";

      const collectorOnChunk = (chunk: string) => {
        collectedResponse += chunk;
        onChunkCallback(chunk);
      };

      if (context && context.trim().length > 0) {
        console.log(
          "Reasoning Node: Generating contextual response based on retrieved context.",
        );
        console.log(
          "Reasoning Node: Context snippet :- ",
          JSON.stringify(context, null, 2),
        );
        await toolManager.getTool("generateContextualResponse").execute({
          query: query,
          context: context,
          history: history,
          onChunk: collectorOnChunk,
        });
        llmToolUsed = "generateContextualResponse";
      } else if (
        plannerDecision.action.name === "generate_response_pure_text" &&
        fullDocumentText &&
        fullDocumentText.trim().length > 0
      ) {
        console.log(
          "Reasoning Node: Generating pure text response as planned and full text available.",
        );
        await toolManager.getTool("generatePureResponse").execute({
          query: query,
          text: fullDocumentText,
          history: history,
          onChunk: collectorOnChunk,
        });
        llmToolUsed = "generatePureResponse";
      } else if (
        plannerDecision.action.name === "generate_response_pure_text" &&
        (!fullDocumentText || fullDocumentText.trim().length === 0)
      ) {
        console.warn(
          "Reasoning Node: Planner requested pure text, but full document text is not available. Generating a general response.",
        );
        await toolManager.getTool("generatePureResponse").execute({
          query: query,
          text: "No document text available to answer this question from the document.",
          history: history,
          onChunk: collectorOnChunk,
        });
        llmToolUsed = "generatePureResponse (fallback: no full text)";
      } else {
        console.warn(
          `Reasoning Node: Cannot generate response. No context, and planner action (${plannerDecision.action.name}) ` +
            `is not 'generate_response_pure_text' or full text not available.`,
        );
        collectedResponse =
          "I couldn't find enough information to answer your query from the document. Please try a different question or check the document content.";
        llmToolUsed = "no_tool_used_fallback";
      }

      console.log(
        `Reasoning node has completed initiating stream using: ${llmToolUsed}`,
      );

      const finalCollectedResponse = collectedResponse;
      console.log(
        "Reasoning Node: Collected LLM response length:",
        finalCollectedResponse.length,
      );
      console.log(
        "Reasoning Node: Collected LLM response (first 200 chars):",
        finalCollectedResponse.substring(0, 200),
      );

      const chatHistoryToUpdate: ChatHistory =
        ((
          await prisma.document.findUnique({
            where: { slug: documentId },
            select: { chatHistory: true },
          })
        )?.chatHistory as ChatHistory) || [];

      const updatedHistory = [
        ...chatHistoryToUpdate,
        { role: "user", content: query },
        { role: "assistant", content: finalCollectedResponse },
      ].filter(Boolean) as ChatHistory;

      console.log(
        "Reasoning Node: Updating Prisma chat history. New history length:",
        updatedHistory.length,
      );

      await prisma.document.update({
        where: { slug: documentId },
        data: { chatHistory: updatedHistory },
      });

      const returnedState = {
        ...state,
        status: "completed" as const,
        response: finalCollectedResponse,
        data: {
          ...state.data,
          llmToolUsed: llmToolUsed,
        },
        chat_history: updatedHistory,
        current_node: "reasoning",
        next_node: "response",
      };

      console.log("Reasoning Node: State being returned:", {
        input_query: returnedState.input_query,
        documentId: returnedState.metadata?.documentId,
        status: returnedState.status,
        responseLength: returnedState.response?.length,
        current_node: returnedState.current_node,
        next_node: returnedState.next_node,
      });

      return returnedState;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in Reasoning Node: ${errorMessage}`);
      return {
        ...state,
        status: "error" as const,
        error: `Failed to generate LLM response: ${errorMessage}`,
        current_node: "reasoning",
        next_node: "error",
      };
    }
  },
});
