import { AgentState, Node } from "../types";

export const responseNode = (): Node => ({
  id: "response",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Response Node ---");

    try {
      const finalResponse = state.response;

      if (typeof finalResponse !== "string" || !finalResponse) {
        console.error(
          "Response node: Missing or invalid final response in state.",
        );
        return {
          ...state,
          status: "error",
          error:
            "Response node did not receive a final string response to output.",
          current_node: "response",
          next_node: "error",
        };
      }

      return {
        ...state,
        status: "completed",
        current_node: "response",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in Response Node: ${errorMessage}`);
      return {
        ...state,
        status: "error",
        error: `Error in Response Node: ${errorMessage}`,
        current_node: "response",
        next_node: "error",
      };
    }
  },
});
