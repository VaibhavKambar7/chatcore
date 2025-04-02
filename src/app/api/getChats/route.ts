import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const chats = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        documents: {
          select: {
            slug: true,
            fileName: true,
          },
        },
      },
    });

    return NextResponse.json(chats?.documents || []);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}