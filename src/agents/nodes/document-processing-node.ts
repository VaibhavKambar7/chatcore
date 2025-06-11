import { Node, AgentState } from "../../agents/types";
import { toolManager } from "../../tools/tool-manager";
import nlp from "compromise";

const MAX_TOKEN_THRESHOLD = 100000;

export const documentProcessingNode = (): Node => ({
  id: "document_processing",
  execute: async (state: AgentState): Promise<AgentState> => {
    console.log("--- Executing Document Processing Node ---");

    const { pdfBuffer, documentId } = state.metadata || {};

    if (!pdfBuffer || !documentId) {
      console.error(
        "Document processing node: Missing required metadata inputs (pdfBuffer or documentId).",
      );
      return {
        ...state,
        status: "error",
        error:
          "Missing required metadata for document processing: pdfBuffer and documentId are necessary.",
        current_node: "document_processing",
        next_node: "error",
      };
    }

    try {
      let currentProcessingStatus: Partial<AgentState> = {
        status: "processing",
        current_node: "document_processing",
        metadata: {
          ...state.metadata,
          processingStep: "extracting_text",
        },
      };

      const { pagesData, totalPages, tokenCount, rawExtractedText } =
        await toolManager.getTool("extractTextFromPDF").execute({
          pdfBuffer: pdfBuffer,
        });

      currentProcessingStatus.metadata = {
        ...currentProcessingStatus.metadata,
        processingStep: "processing_extracted_data",
        tokenCount: tokenCount,
        totalPages: totalPages,
      };

      let allFinalChunks: any[] = [];
      let didGenerateEmbeddings = false;

      if (tokenCount < MAX_TOKEN_THRESHOLD) {
        console.log(
          `Document ${documentId} token count (${tokenCount}) exceeds threshold (${MAX_TOKEN_THRESHOLD}). Proceeding with chunking and embedding.`,
        );
        currentProcessingStatus.metadata = {
          ...currentProcessingStatus.metadata,
          processingStep: "chunking_document",
        };

        let globalChunkIndexCounter = 0;

        for (const page of pagesData) {
          const { text: pageTextContent, pageNumber: currentPageNumber } = page;

          if (!pageTextContent || pageTextContent.trim() === "") {
            console.warn(
              `Skipping chunking for empty page ${currentPageNumber} of document ${documentId}.`,
            );
            continue;
          }

          const preChunksFromPage = await toolManager
            .getTool("chunkText")
            .execute({
              text: pageTextContent,
              totalPages: totalPages,
              pageNumber: currentPageNumber,
            });

          for (const preChunk of preChunksFromPage) {
            let currentChunkContext = "";
            if (allFinalChunks.length > 0) {
              const previousGlobalChunk =
                allFinalChunks[allFinalChunks.length - 1];
              const prevSentences =
                (nlp(previousGlobalChunk.text)
                  .sentences()
                  .out("array") as string[]) || [];
              if (prevSentences.length > 0) {
                currentChunkContext =
                  prevSentences[prevSentences.length - 1].trim();
              }
            }

            const finalChunk = {
              id: `chunk-${documentId}-${globalChunkIndexCounter}`,
              text: preChunk.text,
              metadata: {
                totalPages: preChunk.metadata.totalPages,
                pageNumber: preChunk.metadata.pageNumber,
                chunkIndex: `${globalChunkIndexCounter}`,
                context: currentChunkContext,
                documentId: documentId,
              },
            };
            allFinalChunks.push(finalChunk);
            globalChunkIndexCounter++;
          }
        }

        console.log(
          `Total finalized chunks generated for ${documentId}: ${allFinalChunks.length}`,
        );

        if (allFinalChunks.length > 0) {
          currentProcessingStatus.metadata = {
            ...currentProcessingStatus.metadata,
            processingStep: "generating_embeddings",
          };
          const embeddedChunks = await toolManager
            .getTool("generateEmbeddings")
            .execute({
              chunks: allFinalChunks,
            });

          currentProcessingStatus.metadata = {
            ...currentProcessingStatus.metadata,
            processingStep: "store_embeddings",
          };
          await toolManager.getTool("storeEmbeddings").execute({
            embeddings: embeddedChunks,
            documentId: documentId,
          });
          didGenerateEmbeddings = true;
          console.log(
            `Document ${documentId} chunked, embedded, and stored successfully.`,
          );
        } else {
          console.warn(
            `No chunks were generated for document ${documentId} despite high token count. Skipping embedding and storage.`,
          );
        }
      } else {
        console.log(
          `Document ${documentId} token count (${tokenCount}) is within/under threshold (${MAX_TOKEN_THRESHOLD}). Skipping chunking and embedding.`,
        );
      }

      await toolManager.getTool("updateDocumentStatus").execute({
        documentId: documentId,
        extractedText: rawExtractedText,
        embeddingsGenerated: didGenerateEmbeddings,
        // tokenCount: tokenCount,
      });

      let finalResponseMessage;
      if (didGenerateEmbeddings) {
        finalResponseMessage = `Document ${documentId} processed successfully. Extracted ${totalPages} pages, ${allFinalChunks.length} chunks, estimated ${tokenCount} tokens. Embeddings stored.`;
      } else if (
        allFinalChunks.length === 0 &&
        tokenCount > MAX_TOKEN_THRESHOLD
      ) {
        finalResponseMessage = `Document ${documentId} extracted (${totalPages} pages, ${tokenCount} tokens), but no chunks were generated for embedding (might be too sparse).`;
      } else {
        finalResponseMessage = `Document ${documentId} extracted (${totalPages} pages, ${tokenCount} tokens). Token count is below threshold, so chunking and embedding were skipped.`;
      }

      console.log(
        `Document ${documentId} processing completed. Final message: "${finalResponseMessage}"`,
      );

      return {
        ...state,
        status: "completed",
        response: finalResponseMessage,
        data: {
          ...state.data,
          message: finalResponseMessage,
          text: rawExtractedText,
          tokenCount: tokenCount,
          chunksCount: allFinalChunks.length,
          documentId: documentId,
          embeddingsProcessed: didGenerateEmbeddings,
        },
        current_node: "document_processing",
        next_node: "response",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error in document processing node for document ${documentId}: ${errorMessage}`,
      );
      return {
        ...state,
        status: "error",
        error: `Document processing failed for ${documentId}: ${errorMessage}`,
        current_node: "document_processing",
        next_node: "error",
      };
    }
  },
});
