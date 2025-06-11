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
  }): Promise<AgentState> {
    let initialState: AgentState = {
      status: "processing" as const,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.config.name,
        action: input.action,
        ...(input.metadata || {}),
      },
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
        initialState.chat_history = input.chat_history || [];
        initialState.metadata = {
          ...initialState.metadata,
          documentId: input.documentId,
        };
        break;
      default:
        throw new Error(`Unsupported agent action: ${input.action}`);
    }

    try {
      return await this.workflow.execute(initialState);
    } catch (error) {
      console.error(`MainAgent execution failed: ${error}`);
      return {
        ...initialState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
