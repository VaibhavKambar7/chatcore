import { createSignedURL } from "@/service/s3Service";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { fileName, fileType, slug, ip } = await req.json();

    if (!ip) {
      return NextResponse.json(
        { message: "User identification failed. Cannot upload." },
        { status: 400 },
      );
    }
    if (!fileName || !fileType || !slug) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { ip },
    });

    const objectKey = `${uuidv4()}-${fileName}`;

    await prisma.user.update({
      where: { ip },
      data: {
        documents: {
          create: {
            objectKey,
            slug: slug,
            fileName: fileName,
          },
        },
      },
    });

    const signedUrl = await createSignedURL(objectKey);

    return NextResponse.json({ signedUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload Error: ", error);
    return NextResponse.json(
      { message: "Server error during upload." },
      { status: 500 },
    );
  }
}
