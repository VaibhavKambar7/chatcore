import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const chatHistory = await prisma.document.findUnique({
      where: { slug: id },
    });

    if (!chatHistory) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      response: chatHistory,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
