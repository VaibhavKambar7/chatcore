"use client";

import { Button } from "@/components/ui/button";
import { FolderPlus, Plus } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-[300px] bg-white h-full p-4 flex flex-col border-r border-black">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-black" />
        <span className="text-xl font-semibold text-black">ChatPDF</span>
      </Link>

      <div className="space-y-2">
        <Button
          variant="secondary"
          className="w-full justify-start bg-black text-white hover:bg-gray-800"
          onClick={() => (window.location.href = "/")}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-black border border-black hover:bg-gray-100"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      <div className="mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-black border border-black hover:bg-gray-100"
        >
          Sign in for free to save your chat history
        </Button>
      </div>
    </div>
  );
}
