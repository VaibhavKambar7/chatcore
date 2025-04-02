"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { FaFileAlt } from "react-icons/fa";
import { PiSpinnerBold } from "react-icons/pi";
import Link from "next/link";

export default function Sidebar() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();

  const id = params?.id ? (params.id as string) : null;

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post("/api/getChats", {
          email: "vaibhavkambar@gmail.com",
        });
        setChats(response.data);
      } catch (error) {
        setError("Failed to load chats. Please try again.");
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (id && chats.length > 0) {
      const chat = chats.find((chat) => chat?.slug === id);
      if (chat?.slug) {
        setActiveChat(chat.slug);
      }
    }
  }, [id, chats]);

  return (
    <div className="w-72 bg-gray-100 text-gray-900 p-6 flex flex-col border-r border-gray-300 min-h-screen">
      <div className="text-xl font-bold mb-6">Chatcore</div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-white text-gray-900 p-2 border border-gray-300 focus:outline-none"
        />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        <ul>
          {loading ? (
            <div className="flex items-center justify-center">
              <PiSpinnerBold className="animate-spin text-xl text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : chats.length === 0 ? (
            <div className="text-gray-500 text-center">No chats found</div>
          ) : (
            chats.map((chat) => {
              const isActive =
                activeChat === chat.slug;
              return (
                <li key={chat.slug} className="mb-2">
                  <Link
                    href={`/c/${chat.slug}`}
                    onClick={() => setActiveChat(chat.slug)}
                    className={`flex items-center p-3 transition-colors ${isActive
                      ? "bg-black text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <span className="mr-3">
                      <FaFileAlt />
                    </span>
                    {chat.fileName}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </nav>
    </div>
  );
}
