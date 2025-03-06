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

export const upsertData = async (embeddedChunks: ChunkType[]) => {
  const pineRecords = embeddedChunks.map((chunk) => ({
    id: chunk.id,
    values: chunk.embedding,
    metadata: {
      ...chunk.metadata,
      text: chunk.text,
    },
  }));

  await index.namespace("ns1").upsert(pineRecords);
};
