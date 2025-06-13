import { ChatHistory } from "@/service/llmService";

export interface AgentState {
  status: "idle" | "processing" | "completed" | "error";
  error?: string;
  data?: any;
  metadata?: Record<string, any> & {
    onChunk?: (chunk: string) => void;
    pdfBuffer?: Buffer;
    documentId?: string;
    action?: string;
  };
  input_query?: string;
  response?: string;
  chat_history?: ChatHistory;
  documents?: Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>;
  tool_calls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  current_node?: string;
  next_node?: string;
  needsMoreContext?: boolean;
  llmToolUsed?: string;
  planner_decision?: {
    tool_name: string;
    tool_args: Record<string, any>;
    thought: string;
  };
  iteration_count?: number;
  [key: string]: any;
}

export interface AgentAction {
  type: string;
  payload: any;
}

export interface AgentConfig {
  name: string;
}

export interface Node {
  id: NodeType | string;
  execute: (state: AgentState) => Promise<Partial<AgentState>>;
}
export interface Edge {
  from: string;
  to: string;
  condition?: (state: AgentState) => boolean;
}

export interface WorkflowGraph {
  nodes: Map<string, Node>;
  edges: Edge[];
  entryPoint: string;
}

export type NodeType =
  | "retrieval"
  | "planner"
  | "decision"
  | "tool"
  | "response"
  | "error";
