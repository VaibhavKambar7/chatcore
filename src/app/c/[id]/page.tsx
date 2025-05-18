"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { PDFViewer } from "@/components/pdfViewer";
import { ChatInterface } from "@/components/chatInterface";
import { toast } from "sonner";
import { getIP } from "@/app/utils/getIP";
import { useSession } from "next-auth/react";
import { MESSAGE_LIMIT } from "@/app/utils/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
  isProcessing?: boolean;
}

const Chat = () => {
  const params = useParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  const { data } = useSession();
  const ipRef = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await getIP();
      ipRef.current = ip;
    };
    fetchIP();
  }, []);

  useEffect(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const fetchChatsAndPdf = async () => {
      setLoading(true);
      setIsProcessing(true);
      setMessages([
        {
          role: "assistant",
          content: "Processing your PDF...",
          isProcessing: true,
        },
      ]);

      try {
        const [documentResponse, pdfResponse] = await Promise.all([
          axios.post("/api/getConversation", { id: params.id }),
          axios.post("/api/getPdf", { id: params.id }),
        ]);

        const { chatHistory, embeddingsGenerated } =
          documentResponse?.data?.response || {};
        if (chatHistory?.[0]) {
          setMessages(chatHistory);
          setIsProcessing(false);
        } else {
          if (!embeddingsGenerated) {
            await handlePdf();
          }
          setMessages([
            {
              role: "assistant",
              content:
                "Got it! Your PDF is ready for questions. What do you need to know?",
            },
          ]);
          setIsProcessing(false);
        }

        if (!pdfResponse.data.pdf) {
          throw new Error("PDF data not found");
        }
        setPdfUrl(`data:application/pdf;base64,${pdfResponse.data.pdf}`);
      } catch (error) {
        console.error("Error fetching chats or PDF:", error);
        setMessages([
          {
            role: "assistant",
            content: "Error loading chat history or PDF. Please try again.",
          },
        ]);
        setIsProcessing(false);
        toast.error("Failed to load chat history or PDF.");
      } finally {
        setLoading(false);
        isProcessingRef.current = false;
      }
    };

    fetchChatsAndPdf();
  }, [params.id]);

  const handlePdf = async () => {
    setError("");
    try {
      await axios.post("/api/processDocument", { id: params.id });
    } catch (err) {
      console.error("Error processing document:", err);
      setError((err as Error).message);
      toast.error("Failed to process document.");
    }
  };

  const handleSend = async () => {
    if (!query.trim() || isResponding || isProcessing) return;

    if (query.length > 4000) {
      toast.warning("Message too long. Please limit to 4000 characters.");
      return;
    }

    const ip = ipRef.current;
    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsResponding(true);

    try {
      const usage = await axios.post("/api/rate-limit/get-usage", {
        ip: ip,
        email: data?.user?.email,
      });

      if (!usage.data.isProUser && usage.data.messageCount >= MESSAGE_LIMIT) {
        toast.warning("You have reached the limit of 20 messages.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const response = await axios.post("/api/query", {
        query,
        history: messages,
        documentId: params.id,
      });

      if (response.data.message === "Document not yet processed.") {
        toast.warning("Document is still processing. Try again later.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      await axios.post("/api/rate-limit/increment-message", {
        ip: ip,
        email: data?.user?.email,
      });
    } catch (err) {
      console.error("Error fetching response:", err);
      setError((err as Error).message || "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Failed to get response.");
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
        isProcessing={isProcessing}
        onQueryChange={setQuery}
        onSend={handleSend}
      />
    </div>
  );
};

export default Chat;
