import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import {
  contextualQueryPrompt,
  questionsPrompt,
  summaryPrompt,
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

export const generateSummaryOnly = async (
  text: string,
  onChunk: (chunk: string) => void,
): Promise<string> => {
  try {
    let fullSummary = "";
    let tokenCount = 0;

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token) {
            tokenCount++;
            fullSummary += token;
            onChunk(token);
            console.log(`Token ${tokenCount}: "${token}"`);
          },
        },
      ],
    });

    const chain = summaryPrompt.pipe(model);
    await chain.invoke({
      text: text.substring(0, 15000),
    });

    return fullSummary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Unable to generate summary for this document.";
  }
};

export const generateQuestionsOnly = async (
  text: string,
): Promise<string[]> => {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
      streaming: false,
    });

    const chain = questionsPrompt.pipe(model);
    const response = await chain.invoke({
      text: text.substring(0, 15000),
    });

    let content = response.content as string;

    content = content.trim();
    if (content.includes("```")) {
      content = content.replace(/```json\s*|\s*```/g, "");
    }

    const questions = JSON.parse(content);

    if (Array.isArray(questions)) {
      return questions.slice(0, 3);
    } else {
      throw new Error("Response is not an array");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    return [
      "What is this document about?",
      "What are the key points?",
      "Can you explain the main concepts?",
    ];
  }
};

export const generateSummaryAndQuestions = async (
  text: string,
  onChunk: (chunk: string) => void,
): Promise<{ summary: string; questions: string[] }> => {
  try {
    let streamedContent = "";

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      temperature: 0.7,
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token) {
            onChunk(token);
            streamedContent += token;
          },
        },
      ],
    });

    const chain = generateSummaryAndQuestionsPrompt.pipe(model);
    const response = await chain.invoke({
      text: text.substring(0, 15000),
    });

    let contentToParse = streamedContent || (response.content as string);

    if (contentToParse.includes("```")) {
      contentToParse = contentToParse.replace(/```json\s*|\s*```/g, "");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(contentToParse);
    } catch (parseError) {
      const jsonMatch = contentToParse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    if (!parsedResult.summary || !Array.isArray(parsedResult.questions)) {
      throw new Error("Invalid response structure");
    }

    return {
      summary: parsedResult.summary,
      questions: parsedResult.questions,
    };
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
