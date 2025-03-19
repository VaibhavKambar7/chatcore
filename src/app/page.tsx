"use client";

import { useState } from "react";
import { FileUpload } from "@/components/file-upload";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
      <h1 className="text-5xl font-bold mb-4 text-center text-black">
        Chat with any
        <span className="bg-black text-white px-4 ml-2">PDF</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        Upload your PDF and start asking questions
      </p>

      <FileUpload setPdfUrl={setPdfUrl} />
    </div>
  );
}
