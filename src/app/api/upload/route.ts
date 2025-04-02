import { createSignedURL } from "@/service/s3Service";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { fileName, fileType, slug } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { message: "File name is required." },
        { status: 400 }
      );
    }

    if (!fileType) {
      return NextResponse.json(
        { message: "File type is required." },
        { status: 400 }
      );
    }

    const objectKey = `${uuidv4()}-${fileName}`;

    await prisma.user.upsert({
      where: { email: "vaibhavkambar@gmail.com" },
      update: {
        documents: {
          create: {
            objectKey,
            slug: slug,
            fileName: fileName,
          },
        },
      },
      create: {
        email: "vaibhavkambar@gmail.com",
        name: "Vaibhav",
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

    return NextResponse.json({ signedUrl: signedUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error: ", error.stack);
    }
  }
}
