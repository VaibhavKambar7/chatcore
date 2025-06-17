import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildUserWhere } from "@/app/utils/buildUserWhere";

export async function POST(req: NextRequest) {
  try {
    const { email = null, ip = null, page = 1, limit = 10 } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: buildUserWhere(email, ip),
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalCount = await prisma.document.count({
      where: { userId: user.id },
    });

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      select: {
        slug: true,
        fileName: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: parseInt(limit.toString()),
    });

    return NextResponse.json({
      documents,
      pagination: {
        total: totalCount,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        hasMore: skip + parseInt(limit.toString()) < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}
