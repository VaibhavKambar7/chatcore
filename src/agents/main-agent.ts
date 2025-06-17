import { BaseAgent } from "./base-agent";
import { Workflow } from "./workflow";
import { AgentState, AgentConfig } from "./types";
import { ChatHistory } from "@/service/llmService";

type AgentAction = "process_document" | "answer_query";

export class MainAgent extends BaseAgent {
  private workflow: Workflow;

  constructor(config: AgentConfig) {
    super(config);
    this.workflow = new Workflow();
  }

  async execute(input: {
    action: AgentAction;
    query?: string;
    chat_history?: ChatHistory;
    documentId?: string;
    pdfBuffer?: Buffer;
    metadata?: Record<string, any>;
    useWebSearch: boolean;
  }): Promise<AgentState> {
    let initialState: AgentState = {
      status: "processing",
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.config.name,
        action: input.action,
        ...(input.metadata || {}),
      },
      chat_history: input.chat_history || [],
      useWebSearch: input.useWebSearch,
    };

    switch (input.action) {
      case "process_document":
        if (!input.pdfBuffer || !input.documentId) {
          throw new Error(
            "Missing pdfBuffer or documentId for 'process_document' action.",
          );
        }
        initialState.metadata = {
          ...initialState.metadata,
          pdfBuffer: input.pdfBuffer,
          documentId: input.documentId,
        };
        break;
      case "answer_query":
        if (!input.query || !input.documentId) {
          throw new Error(
            "Missing query or documentId for 'answer_query' action.",
          );
        }
        initialState.input_query = input.query;
        initialState.metadata = {
          ...initialState.metadata,
          documentId: input.documentId,
        };
        initialState.useWebSearch = input.useWebSearch;
        break;
      default:
        throw new Error(`Unsupported agent action: ${input.action}`);
    }

    console.log("MainAgent: Initial state for workflow:", {
      status: initialState.status,
      input_query: initialState.input_query,
      documentId: initialState.metadata?.documentId,
      action: initialState.metadata?.action,
      useWebSearch: initialState.useWebSearch,
    });

    try {
      return await this.workflow.execute(initialState);
    } catch (error) {
      console.error(`MainAgent execution failed: ${error}`);
      return {
        ...initialState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        current_node: initialState.current_node || "main_agent_error",
      };
    }
  }
}
