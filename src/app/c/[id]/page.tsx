"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { PDFViewer } from "@/components/pdfViewer";
import { ChatInterface } from "@/components/chatInterface";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const params = useParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    const fetchChatsAndPdf = async () => {
      setLoading(true);
      try {
        const chatResponse = await axios.post("/api/getConversation", {
          id: params.id,
        });
        const chats = chatResponse?.data?.response?.chatHistory;

        if (chats?.[0]) {
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

        const pdfResponse = await axios.post("/api/getPdf", {
          id: params.id,
        });

        if (!pdfResponse.data.pdf) {
          throw new Error("PDF data not found");
        }

        setPdfUrl(`data:application/pdf;base64,${pdfResponse.data.pdf}`);
        setLoading(false);
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

    fetchChatsAndPdf();
  }, [params.id]);

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

  const handleSend = async () => {
    if (!query.trim() || isResponding) return;

    if (query.length > 4000) {
      toast.warning("Message too long. Please limit to 4000 characters.");
      return;
    }

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
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
      setError((err as Error).message || "Failed to get response");
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <PDFViewer loading={loading} error={error} pdfUrl={pdfUrl} />
      <ChatInterface
        messages={messages}
        query={query}
        isResponding={isResponding}
        onQueryChange={setQuery}
        onSend={handleSend}
      />
    </div>
  );
};

export default Chat;
