import { Tool } from "./types";
import {
  generateSummaryOnly,
  generateQuestionsOnly,
} from "@/service/llmService";

export class SummaryTools {
  static tools: Tool[] = [
    {
      name: "generateSummary",
      description: "Generate document summary",
      execute: async (input: { text: string }) => {
        return new Promise((resolve, reject) => {
          let fullSummary = "";
          generateSummaryOnly(input.text, (chunk) => {
            fullSummary += chunk;
          })
            .then(() => resolve(fullSummary))
            .catch(reject);
        });
      },
    },
    {
      name: "generateQuestions",
      description: "Generate questions about the document",
      execute: async (input: { text: string }) => {
        return generateQuestionsOnly(input.text);
      },
    },
    {
      name: "extractKeyPoints",
      description: "Extract key points from text",
      execute: async (input: { text: string }) => {
        return [];
      },
    },
  ];
}
