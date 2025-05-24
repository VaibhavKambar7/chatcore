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
  const [questions, setQuestions] = useState<string[]>([]);
  const [showQuestions, setShowQuestions] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      setShowQuestions(true);

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
          setShowQuestions(false);
        } else {
          if (!embeddingsGenerated) {
            await handlePdf();
          }
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
      const response = await axios.post("/api/getSummaryAndQuestions", {
        id: params.id,
      });
      setMessages([
        {
          role: "assistant",
          content: response.data.summary,
        },
      ]);
      setQuestions(response.data.questions);
      setShowQuestions(true);
    } catch (err) {
      console.error("Error processing document:", err);
      setError((err as Error).message);
      toast.error("Failed to process document.");
    }
  };

  const handleSend = async (query: string) => {
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
        setIsResponding(false);
        return;
      }

      const assistantPlaceholder: Message = {
        role: "assistant",
        content: "",
      };

      setMessages((prevMessages) => [...prevMessages, assistantPlaceholder]);

      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          history: messages,
          documentId: params.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                streamedContent += parsed.chunk;
                setMessages((prevMessages) => {
                  const newMessages = [...prevMessages];
                  if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1].content =
                      streamedContent;
                  }
                  return newMessages;
                });
              }

              if (parsed.error) {
                console.error("Stream error:", parsed.error);
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e, data);
            }
          }
        }
      }

      await axios.post("/api/rate-limit/increment-message", {
        ip: ip,
        email: data?.user?.email,
      });
    } catch (err) {
      console.error("Error fetching response:", err);
      setError((err as Error).message || "Failed to get response");

      setMessages((prev) => {
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === "assistant" &&
          prev[prev.length - 1].content === ""
        ) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      toast.error("Failed to get response.");
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <PDFViewer
        loading={loading}
        error={error}
        pdfUrl={pdfUrl}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        ip={ipRef.current}
      />
      <ChatInterface
        messages={messages}
        query={query}
        isResponding={isResponding}
        isProcessing={isProcessing}
        onQueryChange={setQuery}
        onSend={handleSend}
        questions={questions}
        showQuestions={showQuestions}
        setShowQuestions={setShowQuestions}
      />
    </div>
  );
};

export default Chat;
