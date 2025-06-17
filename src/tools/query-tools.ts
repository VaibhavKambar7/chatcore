import { Tool } from "../tools/types";
import { queryDB as queryDBService } from "../service/queryService";
import {
  ChatHistory,
  generateContextualLLMResponseStream,
  generatePureLLMResponseStream,
} from "../service/llmService";
import { webSearch } from "@/app/utils/web-search";

interface QueryVectorDBArgs {
  query: string;
  documentId: string;
}

interface WebSearchArgs {
  query: string;
}

interface LLMToolExecuteArgs {
  query: string;
  history: ChatHistory;
  onChunk: (chunk: string) => void;
}

interface ContextualLLMToolArgs extends LLMToolExecuteArgs {
  context: string;
}

interface PureLLMToolArgs extends LLMToolExecuteArgs {
  text: string;
}

export const createQueryVectorDBTool = (): Tool => ({
  name: "queryVectorDB",
  description:
    'Queries the vector database for relevant context based on a user query and a specific document ID. Returns a formatted string of context or a "No matching results" message.',
  execute: async (input: QueryVectorDBArgs) => {
    return queryDBService(input.query, input.documentId);
  },
});

export const createWebSearchTool = (): Tool => ({
  name: "webSearch",
  description:
    "Use this tool to search the web for recent or external information.",
  execute: async (input: WebSearchArgs) => {
    return webSearch(input.query);
  },
});

export const createGenerateContextualResponseTool = (): Tool => ({
  name: "generateContextualResponse",
  description:
    "Generates a detailed LLM response using context retrieved from the vector database and chat history. Collects streamed output into a single response string.",
  execute: async (input: ContextualLLMToolArgs) => {
    return generateContextualLLMResponseStream(
      input.query,
      input.context,
      input.history,
      input.onChunk,
    );
  },
});

export const createGeneratePureResponseTool = (): Tool => ({
  name: "generatePureResponse",
  description:
    "Generates an LLM response without specific vector database context, relying only on the provided full document text and chat history. Collects streamed output into a single response string.",
  execute: async (input: PureLLMToolArgs) => {
    return generatePureLLMResponseStream(
      input.query,
      input.text,
      input.history,
      input.onChunk,
    );
  },
});
