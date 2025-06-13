import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, Node } from "../types";
import { plannerPrompt } from "@/app/utils/prompts";
import { truncateChatHistory, parseJsonSafely } from "@/app/utils/chat-helper";

export const plannerNode = (): Node => ({
  id: "planner",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Planner Node ---");
    console.log("Planner Node: State received:", {
      input_query: state.input_query,
      documentId: state.metadata?.documentId,
      status: state.status,
      embeddingsGenerated: state.metadata?.embeddingsGenerated,
      retrievalStatusMessage: state.data?.retrievalStatusMessage,
      chat_history_length: state.chat_history?.length,
      fullDocumentTextAvailable: !!state.data?.fullDocumentText,
    });

    const query = state.input_query;
    const documentId = state.metadata?.documentId;
    const chatHistory = state.chat_history || [];
    const embeddingsGenerated = state.metadata?.embeddingsGenerated;
    const retrievalStatus = state.data?.retrievalStatusMessage;
    const fullDocumentText = state.data?.fullDocumentText;

    if (!query || !documentId) {
      console.error("Planner Node: Missing query or documentId.");
      return {
        ...state,
        status: "error" as const,
        error: "Planner node requires an input query and documentId.",
        current_node: "planner",
        next_node: "error",
      };
    }

    try {
      const llm = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.0-flash-exp",
        temperature: 0.2,
        apiKey: process.env.GEMINI_API_KEY,
        maxOutputTokens: 1000,
      });

      const chain = plannerPrompt.pipe(llm);

      const truncatedChatHistory = truncateChatHistory(chatHistory, 2000);

      const plannerResult = await chain.invoke({
        query: query,
        embeddings_generated: embeddingsGenerated ? "Yes" : "No",
        retrieval_status: retrievalStatus || "Not yet performed",
        full_document_text_available: fullDocumentText ? "Yes" : "No",
        chat_history: truncatedChatHistory,
        document_id: documentId,
      });

      console.log("Planner Node: LLM Raw result object:", plannerResult);

      let rawPlannerOutput = plannerResult.content as string;

      rawPlannerOutput = rawPlannerOutput
        .replace(/^```json\s*|\s*```$/gm, "")
        .trim();

      const jsonStart = rawPlannerOutput.indexOf("{");
      if (jsonStart > 0) {
        console.log(
          "Planner Node: Found text before JSON, extracting JSON part only",
        );
        rawPlannerOutput = rawPlannerOutput.substring(jsonStart);
      }

      console.log(
        "Planner Node: Cleaned LLM output before JSON parse:",
        rawPlannerOutput.substring(0, 500) +
          (rawPlannerOutput.length > 500 ? "..." : ""),
      );

      let plannerDecision: any;
      try {
        plannerDecision = parseJsonSafely(rawPlannerOutput);
      } catch (jsonParseError) {
        console.error(
          `Planner Node: ERROR parsing JSON: ${jsonParseError}. ` +
            `Raw output attempting to parse: "${rawPlannerOutput.substring(0, 500)}..."`,
        );
        throw new Error(
          `Planner failed to parse LLM JSON output: ${jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError)}`,
        );
      }

      console.log("Planner Node: LLM Decision (parsed JSON):", plannerDecision);

      if (
        !plannerDecision.action ||
        typeof plannerDecision.action !== "object" ||
        !plannerDecision.action.name ||
        typeof plannerDecision.action.args !== "object"
      ) {
        console.error(
          "Planner Node: LLM did not return a valid action structure:",
          plannerDecision,
        );
        throw new Error(
          "Planner LLM did not return a valid action structure. Check prompt and LLM output format.",
        );
      }

      let nextNode: string = "error";
      switch (plannerDecision.action.name) {
        case "query_document":
          nextNode = "retrieval";
          break;
        case "generate_response_from_context":
          nextNode = "reasoning";
          break;
        case "generate_response_pure_text":
          nextNode = "reasoning";
          break;
        default:
          console.error(
            "Planner Node: Unknown action name from LLM:",
            plannerDecision.action.name,
          );
          throw new Error(`Unknown action: ${plannerDecision.action.name}`);
      }

      return {
        ...state,
        status: "processing" as const,
        metadata: {
          ...state.metadata,
          planner_decision: plannerDecision,
        },
        current_node: "planner",
        next_node: nextNode,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in Planner Node: ${errorMessage}`);
      return {
        ...state,
        status: "error" as const,
        error: `Planner failed: ${errorMessage}`,
        current_node: "planner",
        next_node: "error",
      };
    }
  },
});
