import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface DocumentChunk {
  id: string;
  text: string;
  metadata?: {
    pageNumber?: number;
    source?: string;
  };
}

export const generateEmbeddings = async (chunks: DocumentChunk[]) => {
  const model = "multilingual-e5-large";

  const embeddings = await pc.inference.embed(
    model,
    chunks.map((chunk) => chunk.text),
    { inputType: "passage", truncate: "END" }
  );

  return embeddings;
};

export const storeVectorsInPinecone = async (
  chunks: DocumentChunk[],
  embeddings: any[],
  namespace: string = "default"
) => {
  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings[i].values,
    metadata: {
      text: chunk.text,
      pageNumber: chunk.metadata?.pageNumber,
      source: chunk.metadata?.source,
      timestamp: new Date().toISOString(),
    },
  }));

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }
};

export const processDocument = async (
  text: string
): Promise<DocumentChunk[]> => {
  const chunkSize = 1000;
  const overlap = 200;
  const chunks: DocumentChunk[] = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push({
      id: `chunk-${Date.now()}-${i}`,
      text: chunk,
      metadata: {
        pageNumber: Math.floor(i / chunkSize) + 1,
      },
    });
  }

  return chunks;
};

export const queryDocument = async (
  query: string,
  namespace: string = "default"
) => {
  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  const embedding = await pc.inference.embed("multilingual-e5-large", [query], {
    inputType: "query",
  });

  const queryResponse = await index.namespace(namespace).query({
    topK: 5,
    vector: embedding[0].values,
    includeValues: false,
    includeMetadata: true,
  });

  return queryResponse;
};
