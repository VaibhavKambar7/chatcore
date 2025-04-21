import { Pinecone } from "@pinecone-database/pinecone";
import { ChunkType } from "./pdfService";
import * as dotenv from "dotenv";

dotenv.config();
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? "",
});

//   await pc.createIndex({
//     name: "pdf",
//     dimension: 768,
//     metric: "cosine",
//     spec: {
//       serverless: {
//         cloud: "aws",
//         region: "us-east-1",
//       },
//     },
//     deletionProtection: "disabled",
//     tags: { environment: "development" },
//   });

export const index = pc.index("rag");

export const upsertData = async (embeddedChunks: ChunkType[], slug: string) => {
  if (!Array.isArray(embeddedChunks) || embeddedChunks.length === 0) {
    throw new Error(
      "No chunks to upsert. Embedded chunks array is empty or invalid.",
    );
  }

  const pineRecords = embeddedChunks.map((chunk) => ({
    id: chunk.id,
    values: chunk.embedding,
    metadata: {
      ...chunk.metadata,
      text: chunk.text,
      context: chunk.metadata.context,
    },
  }));

  const batchSize = 20;
  let totalUpserted = 0;

  try {
    for (let i = 0; i < pineRecords.length; i += batchSize) {
      const batch = pineRecords.slice(i, i + batchSize);

      const retryUpsert = async (records: typeof batch, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            await index.namespace(`${slug}`).upsert(records);
            return;
          } catch (error) {
            console.error(
              `Attempt ${attempt} failed for batch ${
                Math.floor(i / batchSize) + 1
              }:`,
              error,
            );
            if (attempt === retries) {
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      };

      await retryUpsert(batch);
      totalUpserted += batch.length;
    }

    console.log(`Total records upserted: ${totalUpserted}`);
  } catch (error) {
    console.error("Error during upsert operation:", error);
    throw error;
  }
};
