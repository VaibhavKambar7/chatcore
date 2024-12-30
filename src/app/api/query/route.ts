import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { message: "Query is required." },
        { status: 400 }
      );
    }

    const model = "multilingual-e5-large";
    const embedding = await pc.inference.embed(model, [query], {
      inputType: "query",
    });

    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    const queryResponse = await index.namespace("default").query({
      topK: 5,
      vector: embedding[0].values,
      includeValues: false,
      includeMetadata: true,
    });

    const contexts =
      queryResponse.matches
        ?.map((match) => match.metadata?.text)
        .filter(Boolean)
        .join("\n") || "";

    const promptTemplate = PromptTemplate.fromTemplate(`
      Answer the question based on the following context. If the answer cannot be found
      in the context, say "I cannot find information about this in the document."
      
      Context: {context}
      
      Question: {question}
      
      Answer: `);

    const prompt = await promptTemplate.format({
      context: contexts,
      question: query,
    });

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4",
      temperature: 0.3,
    });

    const response = await llm.call(prompt);

    return NextResponse.json({
      response: response,
      sources: queryResponse.matches?.map((match) => ({
        content: match.metadata?.text,
        score: match.score,
      })),
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
