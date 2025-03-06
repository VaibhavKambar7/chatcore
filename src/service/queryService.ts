import { pipeline } from "@xenova/transformers";
import { generateLLMResponse } from "./llmService";
import { index } from "./uploadService";

async function embedQuery(query: string): Promise<number[]> {
  const embeddingPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2"
  );
  const output = await embeddingPipeline(query, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

export const queryDB = async (query: string) => {
  try {
    const queryEmbedding = await embedQuery(query);
    const response = await index.namespace("ns1").query({
      topK: 2,
      vector: queryEmbedding,
      includeValues: true,
      includeMetadata: true,
    });

    if (response.matches && response.matches.length > 0) {
      const context = response.matches
        .map((match) => match?.metadata?.text)
        .join("\n\n");
      const llmResponse = await generateLLMResponse(query, context);
      return llmResponse;
    } else {
      return "No matching results found.";
    }
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
