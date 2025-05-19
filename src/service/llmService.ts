import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import {
  contextualQueryPrompt,
  generateSummaryAndQuestionsPrompt,
  textOnlyPrompt,
} from "../app/utils/prompts";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-flash-exp",
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
});

export const generatePureLLMResponse = async (
  question: string,
  extractedText: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
) => {
  try {
    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg) : new AIMessage(msg),
    );

    const chain = textOnlyPrompt.pipe(model);
    const response = await chain.invoke({
      question: question,
      extractedText: extractedText,
      history: formattedHistory,
    });

    return response.content;
  } catch (error) {
    console.error("Error generating LLM response:", error);
    return "An error occurred while generating the response.";
  }
};

export const generateContextualLLMResponse = async (
  question: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
) => {
  try {
    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg) : new AIMessage(msg),
    );

    const chain = contextualQueryPrompt.pipe(model);
    const response = await chain.invoke({
      question: question,
      context: context,
      history: formattedHistory,
    });

    return response.content;
  } catch (error) {
    console.error("Error generating LLM response:", error);
    return "An error occurred while generating the response.";
  }
};

export const generateSummaryAndQuestions = async (
  text: string,
): Promise<{ summary: string; questions: string[] }> => {
  try {
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
