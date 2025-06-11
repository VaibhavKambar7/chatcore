import { toolManager } from "@/tools/tool-manager";
import { Node, AgentState } from "../types";

export const retrievalNode = (): Node => ({
  id: "retrieval",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Retrieval Node ---");
    console.log("Retrieval Node: State received:", {
      input_query: state.input_query,
      documentId: state.metadata?.documentId,
      status: state.status,
      current_node: state.current_node,
      next_node: state.next_node,
    });

    const queryToUse = state.input_query;
    const documentId = state.metadata?.documentId;

    if (!queryToUse) {
      console.error("Retrieval node: No input query provided.");
      return {
        ...state,
        status: "error",
        error: "Retrieval node requires an input query.",
        current_node: "retrieval",
        next_node: "error",
      };
    }

    if (!documentId) {
      console.error(
        "Retrieval node: No documentId provided in metadata for querying.",
      );
      return {
        ...state,
        status: "error",
        error:
          "Retrieval node requires a document ID to query the vector database.",
        current_node: "retrieval",
        next_node: "error",
      };
    }

    try {
      console.log(
        `Retrieval Node: Querying vector DB for document '${documentId}' with query: '${queryToUse}'`,
      );

      const retrievedContextString: string = await toolManager
        .getTool("queryVectorDB")
        .execute({
          query: queryToUse,
          documentId: documentId,
        });

      let documents: AgentState["documents"] = [];
      let retrievalStatusMessage: string | undefined;

      if (
        retrievedContextString ===
          "No matching results found to construct context." ||
        !retrievedContextString.trim()
      ) {
        retrievalStatusMessage =
          "No matching results found to construct context.";
        documents = [];
        console.log("Retrieval Node: No matching results found.");
      } else {
        documents = [
          {
            content: retrievedContextString,
            metadata: { source: "vector_db_retrieval", documentId: documentId },
          },
        ];
        retrievalStatusMessage = "Context successfully retrieved.";
        console.log(
          "Retrieval Node: Context retrieved. Length:",
          retrievedContextString.length,
        );
      }

      const returnedState = {
        ...state,
        documents: documents,
        data: {
          ...state.data,
          retrievalStatusMessage: retrievalStatusMessage,
        },
        status: "processing" as const,
        current_node: "retrieval",
        next_node: "reasoning",
      };

      console.log("Retrieval Node: State being returned:", {
        input_query: returnedState.input_query,
        documentId: returnedState.metadata?.documentId,
        status: returnedState.status,
        documentsLength: returnedState.documents?.length,
        retrievalStatusMessage: returnedState.data?.retrievalStatusMessage,
        current_node: returnedState.current_node,
        next_node: returnedState.next_node,
      });

      return returnedState;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in retrieval node: ${errorMessage}`);
      return {
        ...state,
        status: "error",
        error: `Document retrieval failed: ${errorMessage}`,
        current_node: "retrieval",
        next_node: "error",
      };
    }
  },
});
