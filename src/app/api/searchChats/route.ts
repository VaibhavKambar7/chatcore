import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, keyword } = await req.json();

    const whereClause = {
      User: { email },
      ...(keyword
        ? {
            fileName: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}
