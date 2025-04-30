import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { ip, email } = await req.json();

    if (!ip && !email) {
      return NextResponse.json(
        { error: "IP or Email required" },
        { status: 400 },
      );
    }

    const where = email ? { email } : { ip };

    const usage = await prisma.usage.findUnique({ where });

    if (!usage) {
      return NextResponse.json(
        { error: "Usage record not found" },
        { status: 404 },
      );
    }

    await prisma.usage.update({
      where,
      data: {
        pdfCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
