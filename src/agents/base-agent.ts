import { AgentState, AgentConfig } from "./types";
import { toolManager } from "../tools/tool-manager";

export abstract class BaseAgent {
  protected state: AgentState;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.state = {
      status: "idle",
      useWebSearch: false,
    };
  }

  protected async executeTool(toolName: string, input: any): Promise<any> {
    try {
      const tool = toolManager.getTool(toolName);
      return await tool.execute(input);
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.updateState({
        status: "error",
        error: `Tool execution failed: ${errorMessage}`,
      });
      throw error;
    }
  }

  protected updateState(update: Partial<AgentState>): void {
    this.state = {
      ...this.state,
      ...update,
    };
  }

  abstract execute(input: any): Promise<AgentState>;
}
