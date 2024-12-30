import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import { extractTextFromPDF } from "../../utils/pdfParser";
import {
  initializePinecone,
  generateEmbeddings,
  storeVectorsInPinecone,
} from "../../utils/vectorUtils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const form = formidable({});

    const [fields, files] = await form.parse(req);
    const file = files.pdfFile?.[0];

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileBuffer = await fs.readFile(file.filepath);

    const text = await extractTextFromPDF(fileBuffer);

    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    const embeddings = await generateEmbeddings(chunks);

    const index = await initializePinecone();
    await storeVectorsInPinecone(index, embeddings, chunks);

    await fs.unlink(file.filepath);

    res.status(200).json({ message: "PDF processed successfully." });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}
