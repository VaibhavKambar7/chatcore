import nlp from "compromise";
import { LlamaParseReader, Document as LlamaDocument } from "llamaindex";
import { getEmbeddingPipeline } from "@/app/utils/getEmbeddingPipeline";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { estimateTokenCount } from "@/app/utils/estimateTokens";

dotenv.config();

const LLAMA_API_KEY = process.env.LLAMA_CLOUD_API_KEY || "";

export type ChunkType = {
  id: string;
  text: string;
  metadata: {
    totalPages?: number;
    chunkIndex: string;
    context: string;
    sectionTitle?: string;
    pageNumber?: number;
  };
  embedding?: number[];
};

export interface PageContent {
  text: string;
  pageNumber: number;
}

interface PreChunk {
  text: string;
  metadata: {
    pageNumber: number;
    totalPages: number;
  };
}

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

    const documents: LlamaDocument[] = await reader.loadData(tempFilePath);
    fs.unlinkSync(tempFilePath);

    const pagesData: PageContent[] = [];
    let fullTextForTokenCount = "";

    for (const doc of documents) {
      let pageNumber = -1;
      const idPageMatch = doc.id_?.match(/_(\d+)$/);
      if (idPageMatch && idPageMatch[1]) {
        pageNumber = parseInt(idPageMatch[1], 10);
      } else if (doc.metadata?.page_label) {
        pageNumber = parseInt(String(doc.metadata.page_label), 10);
      } else {
        console.warn(
          `Could not reliably determine page number for doc id: ${doc.id_}. Check LlamaParse output structure. Using sequential as fallback.`,
        );
        pageNumber = pagesData.length + 1;
      }

      pagesData.push({ text: doc.text, pageNumber });
      fullTextForTokenCount += doc.text + "\n\n";
    }

    pagesData.sort((a, b) => a.pageNumber - b.pageNumber);

    const tokenCount = estimateTokenCount(fullTextForTokenCount);

    return {
      pagesData,
      totalPages: documents.length,
      tokenCount,
      rawExtractedText: fullTextForTokenCount.trim(),
    };
  } catch (error) {
    console.error("Error extracting text from PDF with LlamaParse:", error);
    throw new Error("Failed to process the PDF file.");
  }
};

export const chunkText = async (
  pageText: string,
  totalPages: number,
  pageNumber: number,
): Promise<PreChunk[]> => {
  const maxChunkSizeChars: number = 1500;
  const overlapRatio: number = 0.15;

  const processedText: string = pageText.replace(/\s+/g, " ").trim();
  if (!processedText) {
    return [];
  }

  const sentences: string[] =
    (nlp(processedText).sentences().out("array") as string[]) || [];

  const pageInternalChunks: PreChunk[] = [];
  if (sentences.length === 0) {
    if (processedText.length > 0) {
      pageInternalChunks.push({
        text: processedText,
        metadata: { totalPages, pageNumber },
      });
    }
    return pageInternalChunks;
  }

  let currentChunkSentences: string[] = [];
  let currentChunkChars: number = 0;

  const addPreChunk = (sentencesToAdd: string[]): void => {
    const chunkTextContent: string = sentencesToAdd.join(" ").trim();
    if (!chunkTextContent) return;

    const newPreChunk: PreChunk = {
      text: chunkTextContent,
      metadata: {
        totalPages: totalPages,
        pageNumber: pageNumber,
      },
    };
    pageInternalChunks.push(newPreChunk);
  };

  for (let i = 0; i < sentences.length; i++) {
    const sentence: string = sentences[i].trim();
    if (!sentence) continue;

    const sentenceLen: number = sentence.length;

    if (sentenceLen > maxChunkSizeChars) {
      if (currentChunkSentences.length > 0) {
        addPreChunk(currentChunkSentences);
        currentChunkSentences = [];
        currentChunkChars = 0;
      }
      const words: string[] = sentence.split(" ");
      let partChunk: string = "";
      for (let j = 0; j < words.length; j++) {
        const word: string = words[j];
        if (
          partChunk.length + (partChunk ? 1 : 0) + word.length >
            maxChunkSizeChars &&
          partChunk
        ) {
          addPreChunk([partChunk]);
          partChunk = word;
        } else {
          partChunk = partChunk ? `${partChunk} ${word}` : word;
        }
      }
      if (partChunk) addPreChunk([partChunk]);
      continue;
    }

    if (
      currentChunkChars +
        (currentChunkSentences.length > 0 ? 1 : 0) +
        sentenceLen >
        maxChunkSizeChars &&
      currentChunkSentences.length > 0
    ) {
      addPreChunk(currentChunkSentences);
      const overlapCount: number = Math.max(
        1,
        Math.floor(currentChunkSentences.length * overlapRatio),
      );
      const overlapStartIndex = Math.max(
        0,
        currentChunkSentences.length - overlapCount,
      );
      currentChunkSentences = [
        ...currentChunkSentences.slice(overlapStartIndex),
        sentence,
      ];
      currentChunkChars = currentChunkSentences.join(" ").length;
    } else {
      currentChunkSentences.push(sentence);
      currentChunkChars = currentChunkSentences.join(" ").length;
    }
  }

  if (currentChunkSentences.length > 0) {
    addPreChunk(currentChunkSentences);
  }

  return pageInternalChunks;
};

export const embedChunks = async (chunkOutputs: ChunkType[]) => {
  const embeddingPipeline = await getEmbeddingPipeline();

  return await Promise.all(
    chunkOutputs.map(async (chunk) => {
      const textToEmbed = chunk.metadata.context
        ? `${chunk.metadata.context} ${chunk.text}`
        : chunk.text;

      const output = await embeddingPipeline(textToEmbed, {
        pooling: "mean",
        normalize: true,
      });

      return {
        id: chunk.id,
        text: chunk.text,
        metadata: chunk.metadata,
        embedding: Array.from(output.data) as number[],
      };
    }),
  );
};
