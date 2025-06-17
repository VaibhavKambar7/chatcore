import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildUserWhere } from "@/app/utils/buildUserWhere";

export async function POST(req: NextRequest) {
  try {
    const { keyword, email = null, ip = null } = await req.json();

    if (!email && !ip) {
      return NextResponse.json(
        { error: "Email or IP required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: buildUserWhere(email, ip),
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        ...(keyword
          ? {
              fileName: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            }
          : {}),
      },
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
