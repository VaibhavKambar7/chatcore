import { documentProcessingNode } from "./nodes/document-processing-node";
import { errorNode } from "./nodes/error-node";
import { plannerNode } from "./nodes/planner-node";
import { reasoningNode } from "./nodes/reasoning-node";
import { responseNode } from "./nodes/response-node";
import { retrievalNode } from "./nodes/retrieval-node";
import prisma from "@/lib/prisma";
import { AgentState, WorkflowGraph, Node, NodeType } from "./types";

type GraphNodeKey =
  | "document_processing"
  | "planner"
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
    const nodesMap = new Map<NodeType | string, Node>();

    nodesMap.set("document_processing", documentProcessingNode());
    nodesMap.set("planner", plannerNode());
    nodesMap.set("retrieval", retrievalNode());
    nodesMap.set("reasoning", reasoningNode());
    nodesMap.set("response", responseNode());
    nodesMap.set("error", errorNode());

    const graph: WorkflowGraph = {
      nodes: nodesMap,
      edges: [],
      entryPoint: "document_processing",
    };

    graph.edges.push({
      from: "*",
      to: "error",
      condition: (state) => state.status === "error",
    });

    graph.edges.push({ from: "document_processing", to: "response" });
    graph.edges.push({ from: "retrieval", to: "reasoning" });
    graph.edges.push({ from: "reasoning", to: "response" });

    return graph;
  }

  async execute(
    initialState: AgentState,
    startingNodeId?: GraphNodeKey,
  ): Promise<AgentState> {
    let currentState: AgentState = { ...initialState };
    let currentNodeId: NodeType | string;

    if (startingNodeId) {
      currentNodeId = startingNodeId;
    } else if (currentState.metadata?.action === "process_document") {
      currentNodeId = "document_processing";
      console.log("Workflow: Starting document processing workflow.");
    } else if (currentState.metadata?.action === "answer_query") {
      currentNodeId = "planner";
      console.log("Workflow: Starting query workflow with Planner.");

      if (currentState.metadata?.documentId) {
        try {
          const documentData = await prisma.document.findUnique({
            where: { slug: currentState.metadata.documentId },
            select: { extractedText: true, embeddingsGenerated: true },
          });

          if (documentData) {
            currentState.metadata = {
              ...currentState.metadata,
              embeddingsGenerated: documentData.embeddingsGenerated,
            };
            currentState.data = {
              ...currentState.data,
              fullDocumentText: documentData.extractedText,
            };
            console.log(
              `Workflow: Loaded document data for planner. Embeddings: ${documentData.embeddingsGenerated}, Text length: ${documentData.extractedText?.length || 0}`,
            );
          } else {
            console.error(
              `Workflow: Document with ID ${currentState.metadata.documentId} not found.`,
            );
            currentState.status = "error";
            currentState.error = `Document with ID ${currentState.metadata.documentId} not found.`;
            return currentState;
          }
        } catch (dbError) {
          console.error(
            `Workflow: Database error while loading document: ${dbError}`,
          );
          currentState.status = "error";
          currentState.error = `Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
          return currentState;
        }
      } else {
        console.error("Workflow: 'answer_query' action requires documentId.");
        currentState.status = "error";
        currentState.error = "Missing documentId for 'answer_query' action.";
        return currentState;
      }
    } else {
      console.error(
        "Workflow received an invalid initial state. No clear starting node.",
      );
      currentState.status = "error";
      currentState.error =
        "Workflow could not determine starting point from initial state.";
      return currentState;
    }

    let loopCount = 0;
    const MAX_LOOP_ITERATIONS = 10;

    while (
      currentNodeId &&
      currentNodeId !== "response" &&
      currentNodeId !== "error"
    ) {
      if (loopCount >= MAX_LOOP_ITERATIONS) {
        console.error(
          `Workflow: Max loop iterations (${MAX_LOOP_ITERATIONS}) reached. Breaking.`,
        );
        currentState.status = "error";
        currentState.error =
          "Max workflow iterations reached, potential infinite loop.";
        currentNodeId = "error";
        break;
      }

      const node = this.graph.nodes.get(currentNodeId);
      if (!node) {
        console.error(
          `Workflow: Node "${currentNodeId}" not found in graph. Transitioning to error.`,
        );
        currentState.status = "error";
        currentState.error = `Invalid node transition: ${currentNodeId}`;
        currentNodeId = "error";
        break;
      }

      console.log(`--- Executing node: ${node.id} ---`);
      console.log(`Workflow: State before ${node.id}:`, {
        input_query: currentState.input_query,
        documentId: currentState.metadata?.documentId,
        status: currentState.status,
        current_node: currentState.current_node,
        next_node_from_prev: currentState.next_node,
        plannerDecision: currentState.metadata?.planner_decision?.action.name,
      });

      let nodeResult = await node.execute(currentState);
      currentState = { ...currentState, ...nodeResult };
      currentState.current_node = node.id;

      console.log(`Workflow: State after ${node.id}:`, {
        input_query: currentState.input_query,
        documentId: currentState.metadata?.documentId,
        status: currentState.status,
        current_node: currentState.current_node,
        next_node_from_node: currentState.next_node,
        error: currentState.error,
        plannerDecision: currentState.metadata?.planner_decision?.action.name,
      });

      if (currentState.status === "error") {
        currentNodeId = "error";
        console.log(
          `Workflow: Error status detected. Transitioning to error node.`,
        );
      } else if (currentState.next_node) {
        if (currentState.next_node === currentState.current_node) {
          console.warn(
            `Workflow: Node ${currentState.current_node} returned itself as next_node. Potential infinite loop.`,
          );
          currentState.status = "error";
          currentState.error = `Infinite loop detected at node ${currentState.current_node}.`;
          currentNodeId = "error";
        } else {
          currentNodeId = currentState.next_node;
          console.log(
            `Workflow: Node ${currentState.current_node} explicitly set next_node to "${currentNodeId}".`,
          );
        }
      } else {
        const potentialEdges = this.graph.edges.filter(
          (edge) =>
            edge.from === currentState.current_node || edge.from === "*",
        );

        let foundNext = false;
        for (const edge of potentialEdges) {
          if (!edge.condition || edge.condition(currentState)) {
            currentNodeId = edge.to;
            foundNext = true;
            console.log(
              `Workflow: Found edge from ${currentState.current_node} to "${currentNodeId}".`,
            );
            break;
          }
        }

        if (!foundNext) {
          console.warn(
            `Workflow: No outgoing edge found from node "${currentState.current_node}". Ending workflow.`,
          );
          if (currentState.status !== "completed") {
            currentState.status = "error";
            currentState.error = `No valid next node found from ${currentState.current_node}.`;
            currentNodeId = "error";
          } else {
            currentNodeId = "";
          }
        }
      }
      loopCount++;
    }

    if (currentNodeId === "error" && currentState.status === "error") {
      const errorNodeInstance = this.graph.nodes.get("error");
      if (errorNodeInstance) {
        console.log("Workflow: Executing final error node.");
        currentState = (await errorNodeInstance.execute(
          currentState,
        )) as AgentState;
      }
    } else if (
      currentNodeId === "response" &&
      currentState.status === "completed"
    ) {
      console.log("Workflow completed successfully at response node.");
    }

    return currentState;
  }
}
