"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { PiSpinnerBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const params = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const response = await axios.post("/api/getChats", {
          id: params.id,
        });

        const chats = response?.data?.response?.chatHistory;

        if (chats) {
          setMessages(chats);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Got it! Your PDF is ready for questions. What do you need to know?",
            },
          ]);
          await handlePdf();
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
        setMessages([
          {
            role: "assistant",
            content: "Error loading chat history. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handlePdf = async () => {
    setError("");
    try {
      const result = await axios.post("/api/processDocument", {
        id: params.id,
      });
      console.log("API response:", result);
    } catch (err) {
      console.error("Error fetching document:", err);
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const userMessage: Message = { role: "user", content: query };
    setQuery("");
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsResponding(true);

    try {
      const response = await axios.post("/api/query", {
        query,
        history: messages,
        documentId: params.id,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (err) {
      console.error("Error fetching response:", err);
      setError((err as Error).message);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="flex justify-center items-center h-[100vh]">
          <PiSpinnerBold className="animate-spin text-4xl text-slate-300" />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div
            className="h-[88vh] w-full border-2 border-amber-50 overflow-y-auto scrollbar-hide"
            ref={scrollRef}
          >
            <div className="p-4 flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[70%] p-3 inline-block bg-black text-grey-100 border-1 border-gray-500 ${
                    message.role === "assistant" ? "self-start " : "self-end"
                  }`}
                >
                  <div className="pros">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isResponding && (
                <div className="self-start max-w-[70%] p-3 flex flex-row bg-black border-1 border-gray-500">
                  <PiSpinnerBold className="animate-spin text-xl inline-block text-gray-500 mr-2" />
                  <div className="text-gray-500">Thinking...</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              disabled={isResponding}
              className="p-2 border-2 border-amber-50 h-[8vh] flex-grow focus:outline-none"
              placeholder="Ask anything about your PDF.."
            />
            {query && (
              <button
                className="h-[8vh] bg-black border-2 border-amber-50 text-white hover:text-black px-4 hover:bg-gray-100 hover:cursor-pointer"
                onClick={handleSend}
              >
                Send
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
