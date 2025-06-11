import { Node, AgentState } from "../types";

export const errorNode = (): Node => ({
  id: "error",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.error("Workflow error:", state.error);

    return {
      ...state,
      status: "error",
      data: {
        message: "An error occurred while processing your request",
        details: state.error,
      },
    };
  },
});
