"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { FaFileAlt } from "react-icons/fa";
import { PiSpinnerBold } from "react-icons/pi";
import { FiChevronDown } from "react-icons/fi";
import Link from "next/link";
import { GoSidebarCollapse } from "react-icons/go";

interface Chat {
  slug: string;
  fileName: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ChatsResponse {
  documents: Chat[];
  pagination: PaginationInfo;
}

const STORAGE_KEY = "chatcore_chat_data";
const EMAIL = "vaibhavkambar@gmail.com";

export default function Sidebar({
  setIsSidebarOpen,
}: {
  setIsSidebarOpen: (open: boolean) => void;
}) {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    hasMore: false,
  });

  const params = useParams();
  const id = params?.id ? (params.id as string) : null;

  const loadCachedChats = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (parsedData.email === EMAIL) {
          setChats(parsedData.chats || []);
          setPagination(
            parsedData.pagination || {
              total: 0,
              page: 1,
              limit: 10,
              hasMore: false,
            }
          );
          return true;
        }
      }
    } catch (error) {
      console.error("Error loading cached chats:", error);
    }
    return false;
  }, []);

  const cacheChats = useCallback(
    (chatsData: Chat[], paginationData: PaginationInfo) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            email: EMAIL,
            chats: chatsData,
            pagination: paginationData,
          })
        );
      } catch (error) {
        console.error("Error caching chats:", error);
      }
    },
    []
  );

  const fetchChats = useCallback(
    async (page: number = 1) => {
      try {
        setError(null);
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        const response = await axios.post<ChatsResponse>("/api/getChats", {
          email: EMAIL,
          page,
          limit: pagination.limit,
        });

        const { documents, pagination: newPagination } = response.data;

        if (page === 1) {
          setChats(documents);
        } else {
          setChats((prevChats) => [...prevChats, ...documents]);
        }

        setPagination(newPagination);
        cacheChats(
          page === 1 ? documents : [...chats, ...documents],
          newPagination
        );
      } catch (error) {
        setError("Failed to load chats. Please try again.");
      } finally {
        if (page === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [pagination.limit, chats, cacheChats]
  );

  useEffect(() => {
    const hasCachedData = loadCachedChats();
    if (!hasCachedData) {
      fetchChats(1);
    } else {
      setLoading(false);
    }
  }, [loadCachedChats, fetchChats]);

  useEffect(() => {
    if (id && chats.length > 0) {
      const chat = chats.find((chat) => chat?.slug === id);
      if (chat?.slug) {
        setActiveChat(chat.slug);
      }
    }
  }, [id, chats]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchChats(pagination.page + 1);
    }
  };

  return (
    <div className="w-72 bg-gray-100 text-gray-900 p-4 flex flex-col border-r border-gray-300 min-h-screen">
      <div className="flex flex-row gap-2 items-center mb-6">
        <GoSidebarCollapse
          className="text-xl cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className="text-xl font-bold">Chatcore</div>
      </div>

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
            <>
              {chats.map((chat) => {
                const isActive = activeChat === chat.slug;
                return (
                  <li key={chat.slug} className="mb-2">
                    <Link
                      href={`/c/${chat.slug}`}
                      onClick={() => setActiveChat(chat.slug)}
                      className={`flex items-center p-3 transition-colors ${
                        isActive
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
              })}

              {pagination.hasMore && (
                <li className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center justify-center w-full p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {loadingMore ? (
                      <PiSpinnerBold className="animate-spin text-xl" />
                    ) : (
                      <>
                        <FiChevronDown className="mr-1" /> Load More
                      </>
                    )}
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
