import { LlamaParseReader } from "llamaindex";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pipeline } from "@xenova/transformers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const LLAMA_API_KEY = process.env.LLAMA_CLOUD_API_KEY || "";

export type ChunkType = {
  id: string;
  text: string;
  metadata: {
    totalPages?: number;
    chunkIndex: string;
    sectionTitle?: string;
    subsectionIndex?: number;
  };
  embedding?: number[];
};

export const extractTextFromPDF = async (pdfBuffer: Buffer) => {
  try {
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBuffer);

    const reader = new LlamaParseReader({
      resultType: "markdown",
      apiKey: LLAMA_API_KEY,
    });

    const documents = await reader.loadData(tempFilePath);

    let extractedText = "";
    for (const doc of documents) {
      extractedText += doc.text;
    }

    fs.unlinkSync(tempFilePath);

    return { text: extractedText, totalPages: documents.length };
  } catch (error) {
    console.error("Error extracting text from PDF with LlamaParse:", error);
    throw new Error("Failed to process the PDF file.");
  }
};

export const chunkText = async (
  text: string,
  totalPages: number,
): Promise<ChunkType[]> => {
  const sections = text.split(/(?=\n#+\s+)/).filter((s) => s.trim());

  const chunks: ChunkType[] = [];
  const maxChunkSize = 500;
  const chunkOverlap = 200;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: maxChunkSize,
    chunkOverlap: chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  for (const [sectionIndex, section] of sections.entries()) {
    const lines = section.trim().split("\n");
    const titleMatch = lines[0].match(/^#+\s+(.+)$/);
    const sectionTitle = titleMatch
      ? titleMatch[1].trim()
      : `Section ${sectionIndex + 1}`;
    const content = lines.slice(1).join("\n").trim();

    if (content.length <= maxChunkSize) {
      chunks.push({
        id: `chunk-${sectionIndex}-0`,
        text: content,
        metadata: {
          totalPages,
          chunkIndex: `${sectionIndex}-0`,
          sectionTitle,
        },
      });
    } else {
      const subChunks = await splitter.createDocuments([content]);
      subChunks.forEach((subChunk, subIdx) => {
        chunks.push({
          id: `chunk-${sectionIndex}-${subIdx}`,
          text: subChunk.pageContent,
          metadata: {
            totalPages,
            chunkIndex: `${sectionIndex}-${subIdx}`,
            sectionTitle,
            subsectionIndex: subIdx,
          },
        });
      });
    }
  }

  return chunks;
};

export const embedChunks = async (chunkOutputs: ChunkType[]) => {
  const embeddingPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2",
  );

  return await Promise.all(
    chunkOutputs.map(async (chunk) => {
      const output = await embeddingPipeline(chunk.text, {
        pooling: "mean",
        normalize: true,
      });
      return {
        id: chunk.id,
        text: chunk.text,
        metadata: chunk.metadata,
        embedding: Array.from(output.data),
      };
    }),
  );
};
