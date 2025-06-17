import { toolManager } from "@/tools/tool-manager";
import { Node, AgentState } from "../types";
import { TavilySnippet } from "@/app/utils/web-search";

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
      useWebSearch: state.useWebSearch,
    });

    const queryToUse = state.input_query;
    const documentId = state.metadata?.documentId;
    const useWebSearch = state.useWebSearch;

    if (!queryToUse) {
      console.error("Retrieval node: No input query provided.");
      return {
        ...state,
        status: "error" as const,
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
        status: "error" as const,
        error:
          "Retrieval node requires a document ID to query the vector database.",
        current_node: "retrieval",
        next_node: "error",
      };
    }

    if (!useWebSearch) {
      console.error(
        "Retrieval node: No useWebSearch provided in metadata for querying.",
      );
    }

    try {
      console.log(
        `Retrieval Node: Querying vector DB for document '${documentId}' with query: '${queryToUse}'`,
      );

      const retrievedContext: string = await toolManager
        .getTool("queryVectorDB")
        .execute({
          query: queryToUse,
          documentId: documentId,
        });

      let webSearchContext = "";
      if (state.useWebSearch) {
        try {
          const webResult = await toolManager.getTool("webSearch").execute({
            query: queryToUse,
          });

          console.log(
            "Retrieval Node: Web search result:",
            JSON.stringify(webResult, null, 2),
          );

          webSearchContext =
            `WEB-SEARCH ANSWER:\n${webResult.answer ?? ""}\n\n` +
            (webResult.results && webResult.results.length > 0
              ? webResult.results
                  .map(
                    (s: TavilySnippet, idx: number) =>
                      `[Snippet ${idx + 1}] [${s.title}](${s.url})\n${s.content}\n`,
                  )
                  .join("\n")
              : "No additional web search results found.\n");

          console.log(
            "Retrieval Node: Web search context length:",
            webSearchContext.length,
          );

          console.log(
            "Retrieval Node: Web search context length:",
            webSearchContext.length,
          );
        } catch (err) {
          console.error("Retrieval Node: Web search failed", err);
        }
      }

      const labelledDocContext = retrievedContext
        ? `DOCUMENT EXTRACTS:\n${retrievedContext}`
        : "";

      const combinedContext = [labelledDocContext, webSearchContext]
        .filter(Boolean)
        .join("\n\n");

      let documents: AgentState["documents"] = [];
      let retrievalStatusMessage: string | undefined;
      let contextForReasoning: string | undefined;

      if (
        retrievedContext ===
          "No matching results found to construct context." ||
        !retrievedContext.trim()
      ) {
        retrievalStatusMessage =
          "No matching results found to construct context.";
        documents = [];
        contextForReasoning = "";
        console.log("Retrieval Node: No matching results found.");
      } else {
        documents = [
          ...(retrievedContext
            ? [
                {
                  content: retrievedContext,
                  metadata: { source: "vector_db_retrieval", documentId },
                },
              ]
            : []),
          ...(webSearchContext
            ? [
                {
                  content: webSearchContext,
                  metadata: { source: "web_search" },
                },
              ]
            : []),
        ];
        retrievalStatusMessage = "Context successfully retrieved.";
        contextForReasoning = combinedContext;
        console.log(
          "Retrieval Node: Context retrieved. Length:",
          retrievedContext.length,
        );
        console.log(
          "Retrieval Node: Context snippet:",
          retrievedContext.substring(0, 200),
          "\n\n",
          "Retrieval Node: Web search context snippet:",
          webSearchContext.substring(0, 200),
        );
      }

      const returnedState = {
        ...state,
        documents: documents,
        data: {
          ...state.data,
          retrievalStatusMessage: retrievalStatusMessage,
          context: contextForReasoning,
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
        contextLength: returnedState.data?.context?.length,
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
        status: "error" as const,
        error: `Document retrieval failed: ${errorMessage}`,
        current_node: "retrieval",
        next_node: "error",
      };
    }
  },
});
