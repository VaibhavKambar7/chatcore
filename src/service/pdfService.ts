import pdf from "pdf-parse";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pipeline } from "@xenova/transformers";
import * as dotenv from "dotenv";

dotenv.config();

export type ChunkType = {
  id: string;
  text: string;
  metadata: {
    totalPages: number;
    chunkIndex: number;
  };
  embedding?: number[];
};

export const cleanData = (data: string): string => {
  let cleaned = data.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/[^ -~\n]/g, "");
  cleaned = cleaned.replace(/Page \d+/g, "");
  cleaned = cleaned.trim();
  return cleaned;
};

export const chunkText = async (
  text: string,
  totalPages: number,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): Promise<ChunkType[]> => {
  const doc = new Document({
    pageContent: text,
    metadata: {
      totalPages,
    },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const chunks = await splitter.splitDocuments([doc]);

  const chunkOutputs: ChunkType[] = chunks.map((chunk, index) => ({
    id: `chunk-${index}`,
    text: chunk.pageContent,
    metadata: {
      totalPages: chunk.metadata.totalPages,
      chunkIndex: index,
    },
  }));

  return chunkOutputs;
};

export const embedChunks = async (chunkOutputs: ChunkType[]) => {
  const embeddingPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2"
  );
  const embeddedChunks: ChunkType[] = [];

  for (const chunk of chunkOutputs) {
    const output = await embeddingPipeline(chunk.text, {
      pooling: "mean",
      normalize: true,
    });

    const embeddingArray = Array.from(output.data);

    embeddedChunks.push({
      id: chunk.id,
      text: chunk.text,
      metadata: chunk.metadata,
      embedding: embeddingArray,
    });
  }

  return embeddedChunks;
};

export const extractTextFromPDF = async (pdfBuffer: Uint8Array) => {
  try {
    const data = await pdf(Buffer.from(pdfBuffer));

    const cleanedOutput = cleanData(data.text);

    const chunkOutputs = await chunkText(cleanedOutput, data.numpages);

    const embeddedChunks = await embedChunks(chunkOutputs);

    return embeddedChunks;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to process the PDF file.");
  }
};
