"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { PiSpinnerBold } from "react-icons/pi";

const Chat = () => {
  const params = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([
    "I have understood your PDF and can answer questions. Ask me anything!",
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePdf = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching PDF with ID:", params.id);
      const result = await axios.post("/api/getFile", { id: params.id });
      console.log("API response:", result);
    } catch (err) {
      console.error("Error fetching document:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    setQuery("");
    setMessages((prevMessages) => [...prevMessages, query]);
    const response = await axios.post("/api/query", { query });
    setMessages((prevMessages) => [...prevMessages, response.data.response]);
    console.log(response);
  };

  useEffect(() => {
    if (params.id) {
      handlePdf();
    } else {
      setLoading(false);
      setError("No document ID provided");
    }
  }, [params.id]);

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
                    index % 2 === 0 ? "self-start " : "self-end"
                  }`}
                >
                  {message}
                </div>
              ))}
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
