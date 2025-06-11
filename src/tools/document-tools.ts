import { Tool } from "../tools/types";
import {
  extractTextFromPDF as extractPDFServiceText,
  chunkText as chunkTextService,
  embedChunks as embedChunksService,
  ChunkType,
  PageContent,
  PreChunk,
} from "../service/pdfService";
import { upsertData as upsertDataService } from "../service/uploadService";
import prisma from "@/lib/prisma";

interface ExtractTextArgs {
  pdfBuffer: Buffer;
}

export const createExtractTextFromPDFTool = (): Tool => ({
  name: "extractTextFromPDF",
  description:
    "Extracts raw text content, page data, total pages, and token count from a PDF buffer using LlamaParse.",
  execute: async (
    args: ExtractTextArgs,
  ): Promise<{
    pagesData: PageContent[];
    totalPages: number;
    tokenCount: number;
    rawExtractedText: string;
  }> => {
    return await extractPDFServiceText(args.pdfBuffer);
  },
});

interface ChunkTextArgs {
  text: string;
  totalPages: number;
  pageNumber: number;
}

export const createChunkTextTool = (): Tool => ({
  name: "chunkText",
  description:
    "Splits a single page's text into smaller, overlapping pre-chunks.",
  execute: async (args: ChunkTextArgs): Promise<PreChunk[]> => {
    return await chunkTextService(args.text, args.totalPages, args.pageNumber);
  },
});

interface GenerateEmbeddingsArgs {
  chunks: ChunkType[];
}

export const createGenerateEmbeddingsTool = (): Tool => ({
  name: "generateEmbeddings",
  description:
    "Generates vector embeddings for an array of structured text chunks (ChunkType).",
  execute: async (args: GenerateEmbeddingsArgs): Promise<ChunkType[]> => {
    return await embedChunksService(args.chunks);
  },
});

interface StoreEmbeddingsArgs {
  embeddings: ChunkType[];
  documentId: string;
}

export const createStoreEmbeddingsTool = (): Tool => ({
  name: "storeEmbeddings",
  description:
    "Stores generated embeddings and their metadata into the vector database.",
  execute: async (args: StoreEmbeddingsArgs): Promise<void> => {
    await upsertDataService(args.embeddings, args.documentId);
  },
});

interface UpdateDocumentStatusArgs {
  documentId: string;
  extractedText: string;
  embeddingsGenerated: boolean;
  tokenCount: number;
}

export const createUpdateDocumentStatusTool = (): Tool => ({
  name: "updateDocumentStatus",
  description:
    "Updates the status of a document in the database after processing (extracted text, embeddings generated flag, token count).",
  execute: async (args: UpdateDocumentStatusArgs): Promise<void> => {
    await prisma.document.update({
      where: { slug: args.documentId },
      data: {
        extractedText: args.extractedText,
        embeddingsGenerated: args.embeddingsGenerated,
        // tokenCount: args.tokenCount
      },
    });
  },
});
