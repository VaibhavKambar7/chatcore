import { Tool, ToolManager } from "../tools/types";

import {
  createExtractTextFromPDFTool,
  createChunkTextTool,
  createGenerateEmbeddingsTool,
  createStoreEmbeddingsTool,
  createUpdateDocumentStatusTool,
} from "./document-tools";

import {
  createQueryVectorDBTool,
  createGenerateContextualResponseTool,
  createGeneratePureResponseTool,
  createWebSearchTool,
} from "./query-tools";

export class ToolManagerImpl implements ToolManager {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
    this.initializeTools();
  }

  private initializeTools() {
    this.registerTool(createExtractTextFromPDFTool());
    this.registerTool(createChunkTextTool());
    this.registerTool(createGenerateEmbeddingsTool());
    this.registerTool(createStoreEmbeddingsTool());
    this.registerTool(createUpdateDocumentStatusTool());

    this.registerTool(createQueryVectorDBTool());
    this.registerTool(createWebSearchTool());
    this.registerTool(createGenerateContextualResponseTool());
    this.registerTool(createGeneratePureResponseTool());
  }

  getTool(name: string): Tool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool;
  }

  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(
        `Tool with name '${tool.name}' already registered. Overwriting.`,
      );
    }
    this.tools.set(tool.name, tool);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const toolManager = new ToolManagerImpl();
