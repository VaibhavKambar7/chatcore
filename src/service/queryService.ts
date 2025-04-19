import { pipeline } from "@xenova/transformers";
import { index } from "./uploadService";

async function embedQuery(query: string): Promise<number[]> {
  try {
    const embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-mpnet-base-v2",
    );
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

    const filters = sectionTitle
      ? { sectionTitle: { $eq: sectionTitle } }
      : undefined;

    const response = await index.namespace(slug).query({
      topK: 5,
      vector: queryEmbedding,
      includeValues: false,
      includeMetadata: true,
      filter: filters,
    });

    if (response.matches && response.matches.length > 0) {
      return response.matches
        .map((match) => {
          const text = match.metadata?.text || "No text available";
          const title = match.metadata?.sectionTitle;
          return title ? `[${title}]\n${text}` : text;
        })
        .join("\n\n");
    }

    return "No matching results found.";
  } catch (error) {
    console.error("Error querying database:", error);
    return "An error occurred during the query.";
  }
};
