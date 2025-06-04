import { pipeline } from "@xenova/transformers";

let embeddingPipelineInstance: any = null;

export async function getEmbeddingPipeline() {
  if (!embeddingPipelineInstance) {
    console.log("Initializing embedding pipeline...");
    embeddingPipelineInstance = await pipeline(
      "feature-extraction",
      "Xenova/all-mpnet-base-v2",
    );
    console.log("Embedding pipeline initialized.");
  }
  return embeddingPipelineInstance;
}
