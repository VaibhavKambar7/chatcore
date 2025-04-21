import nlp from "compromise";
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
    context: string;
    sectionTitle?: string;
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

    console.log("Extracted text:", JSON.stringify(extractedText, null, 4));

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
  const maxChunkSizeChars: number = 1500;
  const overlapRatio: number = 0.15;

  const processedText: string = text.replace(/\s+/g, " ").trim();
  if (!processedText) {
    console.warn("Input text is empty after processing whitespace.");
    return [];
  }
  console.log(
    `Original text length: ${text.length}, Processed text length: ${processedText.length}`,
  );

  const sentences: string[] =
    (nlp(processedText).sentences().out("array") as string[]) || [];
  console.log(`Split into ${sentences.length} sentences.`);

  if (sentences.length === 0) {
    console.warn("Compromise NLP couldn't split the text into sentences.");
    if (processedText.length <= maxChunkSizeChars && processedText.length > 0) {
      console.log("Treating entire text as a single chunk.");
      return [
        {
          id: "chunk-0",
          text: processedText,
          metadata: {
            totalPages,
            chunkIndex: "0",
            context: "",
          },
        },
      ];
    } else if (processedText.length > 0) {
      console.warn(
        "Sentence splitting failed, and text is too long for a single chunk. Consider alternative splitting or check input text.",
      );
      return [
        {
          id: "chunk-0",
          text: processedText.substring(0, maxChunkSizeChars),
          metadata: { totalPages, chunkIndex: "0", context: "" },
        },
      ];
    } else {
      return [];
    }
  }

  const finalChunks: ChunkType[] = [];
  let currentChunkSentences: string[] = [];
  let currentChunkChars: number = 0;
  let chunkNumber: number = 0;

  const addChunk = (
    sentencesToAdd: string[],
    number: number,
    _contextInfo: string = "Normal",
  ): void => {
    const chunkText: string = sentencesToAdd.join(" ").trim();
    if (!chunkText) return;

    let context: string = "";
    if (finalChunks.length > 0) {
      const prevChunk = finalChunks[finalChunks.length - 1];
      const prevSentences: string[] =
        (nlp(prevChunk.text).sentences().out("array") as string[]) || [];
      if (prevSentences.length > 0) {
        context = prevSentences[prevSentences.length - 1].trim();
      }
    }

    const newChunk: ChunkType = {
      id: `chunk-${number}`,
      text: chunkText,
      metadata: {
        totalPages: totalPages,
        chunkIndex: `${number}`,
        context: context,
      },
    };

    finalChunks.push(newChunk);
  };

  for (let i = 0; i < sentences.length; i++) {
    const sentence: string = sentences[i].trim();
    if (!sentence) continue;

    const sentenceLen: number = sentence.length;

    if (sentenceLen > maxChunkSizeChars) {
      console.warn(
        `Sentence ${i} ("${sentence.substring(0, 50)}...") is longer (${sentenceLen} chars) than maxChunkSizeChars (${maxChunkSizeChars}). Splitting.`,
      );

      if (currentChunkSentences.length > 0) {
        addChunk(currentChunkSentences, chunkNumber++, "Before long sentence");
        currentChunkSentences = [];
        currentChunkChars = 0;
      }

      const words: string[] = sentence.split(" ");
      let partChunk: string = "";
      for (let j = 0; j < words.length; j++) {
        const word: string = words[j];
        const potentialPartLength =
          partChunk.length + (partChunk ? 1 : 0) + word.length;

        if (potentialPartLength > maxChunkSizeChars && partChunk) {
          addChunk([partChunk], chunkNumber++, "Long sentence part");
          partChunk = word;
        } else {
          partChunk = partChunk ? `${partChunk} ${word}` : word;
        }
      }
      if (partChunk) {
        addChunk([partChunk], chunkNumber++, "Long sentence remainder");
      }
      continue;
    }

    const potentialSize: number =
      currentChunkChars +
      (currentChunkSentences.length > 0 ? 1 : 0) +
      sentenceLen;

    if (potentialSize > maxChunkSizeChars && currentChunkSentences.length > 0) {
      addChunk(currentChunkSentences, chunkNumber++, "Filled chunk");

      const overlapCount: number = Math.max(
        1,
        Math.floor(currentChunkSentences.length * overlapRatio),
      );
      const overlapStartIndex = Math.max(
        0,
        currentChunkSentences.length - overlapCount,
      );
      const overlapSentences: string[] =
        currentChunkSentences.slice(overlapStartIndex);

      currentChunkSentences = [...overlapSentences, sentence];
      currentChunkChars = currentChunkSentences.join(" ").length;
    } else {
      currentChunkSentences.push(sentence);
      currentChunkChars = currentChunkSentences.join(" ").length;
    }
  }

  if (currentChunkSentences.length > 0) {
    addChunk(currentChunkSentences, chunkNumber++, "Final chunk");
  }

  console.log(
    `Generated ${finalChunks.length} chunks using sentence-aware logic.`,
  );
  return finalChunks;
};

export const embedChunks = async (chunkOutputs: ChunkType[]) => {
  const embeddingPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2",
  );

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
        embedding: Array.from(output.data),
      };
    }),
  );
};
