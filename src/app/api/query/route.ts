import { generateLLMResponse } from "@/service/llmService";
import { queryDB } from "@/service/queryService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, history } = await req.json();

    if (!query) {
      return NextResponse.json(
        { message: "Query is required." },
        { status: 400 }
      );
    }

    const context = await queryDB(query);

    const llmResponse = await generateLLMResponse(query, context, history);

    return NextResponse.json({
      response: llmResponse,
      status: 200,
    });
  } catch (error) {
    console.log("Error", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
