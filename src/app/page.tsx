"use client";

import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import Sidebar from "@/components/sidebar";
import { GoSidebarExpand } from "react-icons/go";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {!isSidebarOpen && (
        <div className="w-14 bg-gray-100 border-r-black border-1">
          <GoSidebarExpand
            className="text-xl mt-5 ml-4 cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          />
        </div>
      )}
      {isSidebarOpen && <Sidebar setIsSidebarOpen={setIsSidebarOpen} />}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <h1 className="text-5xl font-bold mb-4 text-center text-black">
          Chat with any
          <span className="bg-black text-white px-4 ml-2">PDF</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 text-center">
          Upload your PDF and start asking questions
        </p>
        <FileUpload setPdfUrl={setPdfUrl} />
      </div>
    </div>
  );
}
