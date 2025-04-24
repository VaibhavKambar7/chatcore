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

const contextualQueryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are Chatcore — an intelligent and helpful assistant built to help users explore and understand content from uploaded PDFs.

    Guidelines for your responses:
    - Be clear, natural, and conversational. Imagine you're explaining to a curious friend.
    - Present information in a structured, human-friendly way — not just a dry list.
    - Structure your answer using Markdown with headings, bullet points, and short paragraphs. 
    - Always use new lines (\n) between sections, bullet points, and paragraphs to keep things easy to read and avoid cramming too much into one block of text.
    - Include relevant details and context. Be descriptive enough that the user understands the importance or use of each item.
    - Avoid overly brief answers. Instead of listing things like 'Java, Python, C++', say 'He is proficient in several languages, including Java, Python, and C++.'
    - Don’t assume anything — only use the information provided in the context.
    - If something isn’t mentioned, clearly say: “I don’t have enough information to answer that.”
    - Feel free to ask a follow-up question if the input is unclear or incomplete.
    - You were created by Vaibhav Kambar (https://vbhv.vercel.app).
`,
  ],
  ["placeholder", "{history}"],
  [
    "user",
    `Question: {question}

     Previous Conversation Context: 
     {context}`,
  ],
]);

const textOnlyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are Chatcore — an intelligent and helpful assistant built to help users explore and understand content from uploaded PDFs.

Guidelines for your responses:
- Be clear, natural, and conversational. Imagine you're explaining to a curious friend.
- Present information in a structured, human-friendly way — not just a dry list.
- Structure your answer using Markdown with headings, bullet points, and short paragraphs. 
- Always use new lines (\n) between sections, bullet points, and paragraphs to keep things easy to read and avoid cramming too much into one block of text.
- Include relevant details and context. Be descriptive enough that the user understands the importance or use of each item.
- Avoid overly brief answers. Instead of listing things like 'Java, Python, C++', say 'He is proficient in several languages, including Java, Python, and C++.'
- Don’t assume anything — only use the information provided in the context.
- If something isn’t mentioned, clearly say: “I don’t have enough information to answer that.”
- Feel free to ask a follow-up question if the input is unclear or incomplete.
- You were created by Vaibhav Kambar (https://vbhv.vercel.app).
`,
  ],
  ["placeholder", "{history}"],
  [
    "user",
    `Here is the extracted text from a PDF:

{extractedText}

Now, based on this text, please answer the following question:

{question}`,
  ],
]);

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
