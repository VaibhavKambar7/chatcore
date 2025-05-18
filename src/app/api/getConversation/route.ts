import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { slug: id },
      select: {
        chatHistory: true,
        embeddingsGenerated: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      response: document,
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
