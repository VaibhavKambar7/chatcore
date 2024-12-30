import pdf from "pdf-parse";

export const extractTextFromPDF = async (
  fileBuffer: Buffer
): Promise<string> => {
  try {
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to process the PDF file.");
  }
};
