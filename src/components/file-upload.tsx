"use client";

import type React from "react";
import { useState, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { PiSpinnerBold } from "react-icons/pi";

interface FileUploadProps {
  setPdfUrl: Dispatch<SetStateAction<string | null>>;
}

export function FileUpload({ setPdfUrl }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find((file) => file.type === "application/pdf");

    if (pdfFile) {
      setSelectedFile(pdfFile);
    }
  };

  const handleFile = async (file: File) => {
    setSelectedFile(file);
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

      setPdfUrl(signedUrl);
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
    <div
      className={`w-full max-w-3xl relative bg-white flex flex-col items-center justify-center text-center gap-5 border-2 border-dotted border-gray-400/40
              p-20 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)]
              transition-all duration-200 ease-in-out ${
                isDragging ? "bg-gray-100" : ""
              }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-3">
          <Upload className="h-8 w-8 text-black" />
        </div>
        <h3 className="text-sm text-gray-800">
          {selectedFile
            ? selectedFile.name
            : "Click to upload, or drag PDF here"}
        </h3>
      </div>

      <Button
        variant="secondary"
        className="bg-black text-white hover:bg-gray-800 rounded-none px-6 py-3 text-base w-[160px] h-[48px] flex items-center justify-center"
        onClick={() => {
          if (selectedFile) {
            handleUpload();
          } else {
            document.getElementById("file-upload")?.click();
          }
        }}
        disabled={loading}
      >
        <div className="w-full flex items-center justify-center">
          {loading ? (
            <PiSpinnerBold className="animate-spin text-4xl" />
          ) : selectedFile ? (
            <span className="tracking-wide">Upload PDF</span>
          ) : (
            <span className="tracking-wide">Choose PDF</span>
          )}
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </Button>
    </div>
  );
}
