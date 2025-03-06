"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { PiSpinnerBold } from "react-icons/pi";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const id = uuidv4();

      const response = await axios.post(
        "/api/upload",
        {
          fileName: selectedFile?.name,
          fileType: selectedFile?.type,
          slug: id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const signedUrl = response.data.signedUrl;

      await axios.put(signedUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      router.push(`/c/${id}`);

      setLoading(false);

      toast.success("File uploaded successfully!");
    } catch (error) {
      setLoading(false);
      console.error("Upload error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          `Upload failed: ${error.response?.data?.message || error.message}`
        );
      } else {
        toast.error("Upload failed. Check console for details.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans">
      <h1 className="text-4xl font-bold mb-8 uppercase tracking-wider">
        Chatcore
      </h1>
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-white text-black py-3 px-6 border-2 border-white rounded-none cursor-pointer text-center overflow-hidden text-ellipsis whitespace-nowrap w-full box-border"
        >
          {selectedFile ? selectedFile.name : "Choose a PDF file"}
        </label>
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className={`py-3 px-6 border-2 border-white flex justify-center items-center rounded-none font-bold w-full box-border transition-colors ${
            selectedFile
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-black text-white opacity-50 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <PiSpinnerBold className="animate-spin text-2xl text-black" />
          ) : (
            "UPLOAD PDF"
          )}
        </button>
      </div>
    </div>
  );
}
