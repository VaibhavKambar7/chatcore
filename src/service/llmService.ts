import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import {
  contextualQueryPrompt,
  generateSummaryAndQuestionsPrompt,
  textOnlyPrompt,
} from "../app/utils/prompts";

dotenv.config();

export async function generateContextualLLMResponseStream(
  question: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  onChunk: (chunk: string) => void,
) {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token) {
            onChunk(token);
          },
        },
      ],
    });

    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

    const chain = contextualQueryPrompt.pipe(model);
    await chain.invoke({
      question: question,
      context: context,
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Error generating streaming LLM response:", error);
    throw error;
  }
}

export async function generatePureLLMResponseStream(
  question: string,
  extractedText: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  onChunk: (chunk: string) => void,
) {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token) {
            onChunk(token);
          },
        },
      ],
    });

    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

    const chain = textOnlyPrompt.pipe(model);
    await chain.invoke({
      question: question,
      extractedText: extractedText,
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Error generating streaming LLM response:", error);
    throw error;
  }
}

export const generateSummaryAndQuestions = async (
  text: string,
): Promise<{ summary: string; questions: string[] }> => {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
    });

    const chain = generateSummaryAndQuestionsPrompt.pipe(model);
    const response = await chain.invoke({
      text: text.substring(0, 15000),
    });

    let cleanedContent = response.content as string;

    if (cleanedContent.includes("```")) {
      cleanedContent = cleanedContent.replace(/```json\s*|\s*```/g, "");
    }

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("Error generating summary and questions:", error);
    return {
      summary: "Unable to generate summary for this document.",
      questions: [
        "What is this document about?",
        "What are the key points?",
        "Can you explain the main concepts?",
      ],
    };
  }
};
