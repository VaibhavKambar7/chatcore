import { queryDB } from "@/service/queryService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { message: "Query is required." },
        { status: 400 }
      );
    }

    // const document = await prisma.document.findFirst({
    //   where: {
    //     User: {
    //       email: "vaibhavkambar@gmail.com",
    //     },
    //   },
    //   select: {
    //     objectKey: true,
    //     fileName: true,
    //   },
    // });

    // if (!document) {
    //   return NextResponse.json(
    //     { message: "Document not found." },
    //     { status: 404 }
    //   );
    // }

    // const { objectKey, fileName } = document;

    // console.log(fileName);

    // const fileObject = await getFileFromS3(objectKey);

    // console.log(fileObject);

    const response = await queryDB(query);

    return NextResponse.json({
      response: response,
      status: 200,
    });
  } catch (error) {
    console.log("Error", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
