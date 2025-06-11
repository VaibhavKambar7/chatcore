import { Node, AgentState } from "../types";
import { toolManager } from "../../tools/tool-manager";
import prisma from "@/lib/prisma";
import { ChatHistory } from "@/service/llmService";

export const reasoningNode = (): Node => ({
  id: "reasoning",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Reasoning Node ---");
    console.log("Reasoning Node: State received:", {
      input_query: state.input_query,
      documentId: state.metadata?.documentId,
      status: state.status,
      current_node: state.current_node,
      next_node: state.next_node,
      documentsLength: state.documents?.length,
      retrievalStatusMessage: state.data?.retrievalStatusMessage,
      onChunkCallbackPresent: !!state.metadata?.onChunkCallback,
    });

    try {
      const query = state.input_query;
      const history = state.chat_history || [];
      const documentId = state.metadata?.documentId;
      const onChunkCallback = state.metadata?.onChunkCallback;

      if (!query)
        console.error("Reasoning Node: 'query' is missing or undefined.");
      if (!documentId)
        console.error("Reasoning Node: 'documentId' is missing or undefined.");
      if (!onChunkCallback)
        console.error(
          "Reasoning Node: 'onChunkCallback' is missing or undefined.",
        );

      if (!query || !documentId || !onChunkCallback) {
        console.error(
          "Reasoning node: Missing essential parameters (query, documentId, or onChunkCallback).",
        );
        return {
          ...state,
          status: "error",
          error:
            "Reasoning node requires an input query, documentId, and a streaming callback.",
          current_node: "reasoning",
          next_node: "error",
        };
      }

      const document = await prisma.document.findUnique({
        where: { slug: documentId },
        select: {
          extractedText: true,
          embeddingsGenerated: true,
          chatHistory: true,
        },
      });

      if (!document) {
        console.error(
          `Reasoning node: Document with ID ${documentId} not found in DB.`,
        );
        return {
          ...state,
          status: "error",
          error: `Document with ID ${documentId} not found.`,
          current_node: "reasoning",
          next_node: "error",
        };
      }

      const fullDocumentText = document.extractedText ?? "";
      let llmToolUsed = "";
      let collectedResponse = "";

      const collectorOnChunk = (chunk: string) => {
        collectedResponse += chunk;
        onChunkCallback(chunk);
      };

      console.log(
        `Reasoning Node: Document embeddingsGenerated: ${document.embeddingsGenerated}`,
      );

      if (document.embeddingsGenerated) {
        const documentsFromRetrieval = state.documents;
        const retrievalStatusMessage = state.data?.retrievalStatusMessage;

        console.log(
          `Reasoning Node: Documents from retrieval: ${documentsFromRetrieval?.length}, Retrieval Status: ${retrievalStatusMessage}`,
        );

        if (
          documentsFromRetrieval &&
          documentsFromRetrieval.length > 0 &&
          !(
            retrievalStatusMessage &&
            retrievalStatusMessage.includes("No matching results")
          )
        ) {
          console.log(
            "Reasoning node: Context found from retrieval. Initiating contextual response stream.",
          );
          const context = documentsFromRetrieval
            .map((doc) => doc.content)
            .join("\n\n---\n\n");
          console.log(
            "Reasoning Node: Context passed to LLM (first 200 chars):",
            context.substring(0, 200),
          );

          await toolManager.getTool("generateContextualResponse").execute({
            query: query,
            context: context,
            history: history,
            onChunk: collectorOnChunk,
          });
          llmToolUsed = "generateContextualResponse";
        } else {
          console.log(
            "Reasoning node: Retrieval found no relevant context (or message indicated it). Falling back to pure response stream.",
          );
          console.log(
            "Reasoning Node: Using full document text for pure response. Length:",
            fullDocumentText.length,
          );
          await toolManager.getTool("generatePureResponse").execute({
            query: query,
            text: fullDocumentText,
            history: history,
            onChunk: collectorOnChunk,
          });
          llmToolUsed = "generatePureResponse (fallback from retrieval)";
        }
      } else {
        console.log(
          "Reasoning node: Embeddings not generated for document. Initiating pure response stream based on full text.",
        );
        console.log(
          "Reasoning Node: Using full document text for pure response. Length:",
          fullDocumentText.length,
        );
        await toolManager.getTool("generatePureResponse").execute({
          query: query,
          text: fullDocumentText,
          history: history,
          onChunk: collectorOnChunk,
        });
        llmToolUsed = "generatePureResponse (no embeddings)";
      }

      console.log(
        `Reasoning node has completed initiating stream using: ${llmToolUsed}`,
      );

      const finalCollectedResponse =
        typeof collectedResponse === "string"
          ? collectedResponse
          : String(collectedResponse);
      console.log(
        "Reasoning Node: Collected LLM response length:",
        finalCollectedResponse.length,
      );
      console.log(
        "Reasoning Node: Collected LLM response (first 200 chars):",
        finalCollectedResponse.substring(0, 200),
      );

      const chatHistoryToUpdate: ChatHistory = (document?.chatHistory ||
        []) as ChatHistory;
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
        status: "error",
        error: `Failed to generate LLM response: ${errorMessage}`,
        current_node: "reasoning",
        next_node: "error",
      };
    }
  },
});
