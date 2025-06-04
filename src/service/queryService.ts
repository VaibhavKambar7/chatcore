import { getEmbeddingPipeline } from "@/app/utils/getEmbeddingPipeline";
import { index } from "./uploadService";

async function embedQuery(query: string): Promise<number[]> {
  try {
    const embeddingPipeline = await getEmbeddingPipeline();

    const output = await embeddingPipeline(query, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data) as number[];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

export const queryDB = async (
  query: string,
  slug: string,
  sectionTitle?: string,
): Promise<string> => {
  try {
    const queryEmbedding = await embedQuery(query);

    const response = await index.namespace(slug).query({
      topK: 5,
      vector: queryEmbedding,
      includeValues: false,
      includeMetadata: true,
      // filter: filters,
    });

    console.log("Response:", JSON.stringify(response.matches, null, 4));

    if (response.matches && response.matches.length > 0) {
      const ans = response.matches
        .map((match) => {
          const text = match.metadata?.text || "No text available";
          const context = match.metadata?.context;
          return context ? `Context: ${context}\n${text}` : text;
        })
        .join("\n\n");
      console.log("Answer:", JSON.stringify(ans, null, 4));
      return ans;
    }

    return "No matching results found.";
  } catch (error) {
    console.error("Error querying database:", error);
    return "An error occurred during the query.";
  }
};
