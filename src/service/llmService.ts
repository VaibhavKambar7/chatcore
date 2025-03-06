import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-pro",
  apiKey: process.env.GEMINI_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant that answers questions based on the provided context.",
  ],
  ["user", "{question}\n\nContext:\n{context}"],
]);

export const generateLLMResponse = async (
  question: string,
  context: string
) => {
  try {
    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      question: question,
      context: context,
    });
    return response.content;
  } catch (error) {
    console.error("Error generating LLM response:", error);
    return "An error occurred while generating the response.";
  }
};
