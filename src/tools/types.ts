export interface Tool {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
}

export interface ToolManager {
  getTool: (name: string) => Tool | undefined;
  registerTool: (tool: Tool) => void;
  listTools: () => Tool[];
}
