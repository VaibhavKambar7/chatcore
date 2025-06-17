import axios from "axios";
import "dotenv/config";
import { TAVILY_API_URL } from "./constants";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!TAVILY_API_KEY) {
  throw new Error("TAVILY_API_KEY is not set in environment variables.");
}

export interface TavilySnippet {
  title: string;
  url: string;
  content: string;
}

export interface TavilyResponse {
  answer: string;
  snippets: TavilySnippet[];
  sources: string[];
  follow_up_questions: string[];
}

export async function webSearch(query: string): Promise<TavilyResponse> {
  try {
    const { data } = await axios.post<TavilyResponse>(TAVILY_API_URL, {
      api_key: TAVILY_API_KEY,
      query,
      include_answer: true,
      include_sources: true,
      max_results: 3,
    });

    return data;
  } catch (error) {
    console.error("Tavily search error:", error);
    throw new Error("Failed to fetch search results from Tavily.");
  }
}
