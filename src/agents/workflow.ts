import { documentProcessingNode } from "./nodes/document-processing-node";
import { errorNode } from "./nodes/error-node";
import { reasoningNode } from "./nodes/reasoning-node";
import { responseNode } from "./nodes/response-node";
import { retrievalNode } from "./nodes/retrieval-node";

import { AgentState, WorkflowGraph } from "./types";

type GraphNodeKey =
  | "document_processing"
  | "retrieval"
  | "reasoning"
  | "response"
  | "error"
  | "query_init";

export class Workflow {
  private graph: WorkflowGraph;

  constructor() {
    this.graph = this.initializeGraph();
  }

  private initializeGraph(): WorkflowGraph {
    const graph: WorkflowGraph = {
      nodes: new Map(),
      edges: [],
      entryPoint: "document_processing",
    };

    graph.nodes.set("document_processing", documentProcessingNode());
    graph.nodes.set("retrieval", retrievalNode());
    graph.nodes.set("reasoning", reasoningNode());
    graph.nodes.set("response", responseNode());
    graph.nodes.set("error", errorNode());

    graph.edges.push({ from: "document_processing", to: "response" });

    graph.edges.push({
      from: "*",
      to: "error",
      condition: (state) => state.status === "error",
    });

    graph.edges.push(
      { from: "retrieval", to: "reasoning" },
      { from: "reasoning", to: "response" },
    );

    return graph;
  }

  async execute(
    initialState: AgentState,
    startingNodeId?: GraphNodeKey,
  ): Promise<AgentState> {
    let currentState = { ...initialState };
    let currentNodeId: GraphNodeKey;

    if (startingNodeId) {
      currentNodeId = startingNodeId;
    } else if (currentState.metadata?.action === "process_document") {
      currentNodeId = "document_processing";
    } else if (currentState.input_query && currentState.metadata?.documentId) {
      currentNodeId = "retrieval";
    } else if (currentState.input_query) {
      console.warn(
        "Workflow received a query without a documentId. This flow might not be fully defined yet.",
      );
      currentState.status = "error";
      currentState.error =
        "Query requires a documentId for processing in this workflow.";
      return currentState;
    } else {
      console.error(
        "Workflow received an invalid initial state. No clear starting node.",
      );
      currentState.status = "error";
      currentState.error =
        "Workflow could not determine starting point from initial state.";
      return currentState;
    }

    while (currentNodeId) {
      const node = this.graph.nodes.get(currentNodeId);
      if (!node) {
        console.error(`Workflow: Node "${currentNodeId}" not found in graph.`);
        currentState.status = "error";
        currentState.error = `Invalid node transition: ${currentNodeId}`;
        break;
      }

      console.log(`Executing node: ${node.id}`);
      let nextState = await node.execute(currentState);

      currentState = { ...currentState, ...nextState };

      if (currentState.status === "error") {
        currentNodeId = "error";
        const errorNodeInstance = this.graph.nodes.get("error");
        if (errorNodeInstance) {
          currentState = await errorNodeInstance.execute(currentState);
        }
        break;
      }
      if (currentState.status === "completed" && currentNodeId === "response") {
        console.log("Workflow completed successfully at response node.");
        break;
      }

      const potentialEdges = this.graph.edges.filter(
        (edge) => edge.from === currentNodeId || edge.from === "*",
      );

      let foundNext = false;
      for (const edge of potentialEdges) {
        if (!edge.condition || edge.condition(currentState)) {
          currentNodeId = edge.to as GraphNodeKey;
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        console.warn(
          `Workflow: No outgoing edge found from node "${currentNodeId}". Ending workflow.`,
        );
        break;
      }
    }

    return currentState;
  }
}
