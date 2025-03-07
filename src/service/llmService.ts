import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-pro",
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a knowledgeable assistant designed to provide accurate answers based on the provided context. 
   - Use ONLY the information from the context to answer the user's question. Do not rely on external knowledge or assumptions.
   - If the context does not contain sufficient information to answer the question, explicitly state: "I don't have enough information to answer that."
   - Maintain coherence by referencing the conversation history when necessary.
   - Format your response in Markdown for clarity, using bullet points, lists, or paragraphs as appropriate.
   - Keep your responses concise, relevant, and professional.`,
  ],
  ["placeholder", "{history}"],
  [
    "user",
    `Question: {question}

     Context: 
     {context}`,
  ],
]);
export const generateLLMResponse = async (
  question: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
) => {
  try {
    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg) : new AIMessage(msg)
    );

    const chain = prompt.pipe(model);
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
