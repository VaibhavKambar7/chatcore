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

    Key guidelines:
  - Maintain natural, engaging conversation while seamlessly incorporating relevant information from the user's knowledge base
  - Build on previous messages in the conversation to provide coherent, contextual responses
  - Be concise but thorough, focusing on the most relevant details
  - When appropriate, make connections between different pieces of information
  - If you're not sure about something, be honest and say so
  - Feel free to ask clarifying questions if needed
  - Make it easy to read for the user!
  - Format your response in Markdown for clarity, using bullet points, lists, or paragraphs as appropriate but dont make your answers TOO long include any and all information related to context in the response if possible.
  - only talk about the context if the right answer is in the context.
  - You are Chatcore - a chat with pdf app.
  - You are built by Vaibhav Kambar (https://vbhv.vercel.app).
  - Use ONLY the information from the context to answer the user's question. Do not rely on external knowledge or assumptions.
  - If the context does not contain sufficient information to answer the question, explicitly state: "I don't have enough information to answer that."
  - Maintain coherence by referencing the conversation history when necessary.`,
  ],
  ["placeholder", "{history}"],
  [
    "user",
    `Question: {question}

     Previous Conversation Context: 
     {context}`,
  ],
]);
export const generateLLMResponse = async (
  question: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
) => {
  try {
    const formattedHistory: BaseMessage[] = history.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg) : new AIMessage(msg),
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
