import { pipeline } from "@xenova/transformers";
import { index } from "./uploadService";

async function embedQuery(query: string): Promise<number[]> {
  try {
    const embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-mpnet-base-v2"
    );
    const output = await embeddingPipeline(query, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data) as number[];
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

export const queryDB = async (query: string): Promise<string> => {
  try {
    const queryEmbedding = await embedQuery(query);
    const response = await index.namespace("ns1").query({
      topK: 2,
      vector: queryEmbedding,
      includeValues: true,
      includeMetadata: true,
    });

    if (response.matches && response.matches.length > 0) {
      return response.matches
        .map((match) => match?.metadata?.text)
        .filter(Boolean)
        .join("\n\n");
    }
    return "No matching results found.";
  } catch (error) {
    console.error("Error querying database:", error);
    return "An error occurred during the query.";
  }
};

// const main = async () => {
//   const result = await queryDB("now give the tech stack for them");
//   console.log("LLM Response:", result);
// };

// main();
