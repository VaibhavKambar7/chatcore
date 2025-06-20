"use client";

import React, { useEffect, useRef, Fragment, JSX, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { CiGlobe } from "react-icons/ci";
import CopyButton from "./copy-button";

interface Message {
  role: "user" | "assistant";
  content: string;
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  query: string;
  isResponding: boolean;
  isProcessing: boolean;
  onQueryChange: (query: string) => void;
  onSend: (query: string, useWebSearch: boolean) => void;
  questions: string[];
  showQuestions: boolean;
  setShowQuestions: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigateToPage?: (pageNumber: number) => void;
  slug: string;
}

export function ChatInterface({
  messages,
  query,
  isResponding,
  isProcessing,
  onQueryChange,
  onSend,
  questions,
  showQuestions,
  setShowQuestions,
  onNavigateToPage,
  slug,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getStorageKey = (slug: string) => `webSearch_${slug}`;

  const [useWebSearch, setUseWebSearch] = React.useState<boolean>(() => {
    const stored = localStorage.getItem(getStorageKey(slug));
    return stored ? JSON.parse(stored) : false;
  });

  const handleWebSearchToggle = () => {
    const newValue = !useWebSearch;
    setUseWebSearch(newValue);
    localStorage.setItem(getStorageKey(slug), JSON.stringify(newValue));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuestion = (question: string) => {
    if (isResponding || isProcessing) return;
    onQueryChange(question);
    setShowQuestions(false);
    onSend(question, useWebSearch);
  };

  const handleSend = () => {
    if (!query.trim() || isResponding || isProcessing) return;
    onSend(query, useWebSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const markdownComponents: Components = {
    p: ({ node, ...props }) => {
      const childrenWithCitations = React.Children.toArray(props.children).map(
        (child, index) => {
          if (typeof child === "string") {
            const text = child;
            const citationRegex = /\(Page (\d+)\)/g;
            let lastIndex = 0;
            const parts: (string | JSX.Element)[] = [];
            let match;

            while ((match = citationRegex.exec(text)) !== null) {
              if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
              }
              const pageNum = parseInt(match[1], 10);
              parts.push(
                <button
                  key={`btn-cite-${index}-${match.index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToPage) onNavigateToPage(pageNum);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-0.5 px-1.5 rounded-md text-xs mx-0.5 align-middle cursor-pointer transition-colors duration-150 border border-gray-300"
                  title={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>,
              );
              lastIndex = citationRegex.lastIndex;
            }
            if (lastIndex < text.length) {
              parts.push(text.substring(lastIndex));
            }
            return parts.length > 0 ? (
              <Fragment key={`frag-${index}`}>
                {parts.map((p, i) => (
                  <Fragment key={i}>{p}</Fragment>
                ))}
              </Fragment>
            ) : (
              text
            );
          }
          return child;
        },
      );
      return <p className={props.className}>{childrenWithCitations}</p>;
    },
    li: ({ node, ...props }) => {
      const childrenWithCitations = React.Children.toArray(props.children).map(
        (child, index) => {
          if (typeof child === "string") {
            const text = child;
            const citationRegex = /\(Page (\d+)\)/g;
            let lastIndex = 0;
            const parts: (string | JSX.Element)[] = [];
            let match;
            while ((match = citationRegex.exec(text)) !== null) {
              if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
              }
              const pageNum = parseInt(match[1], 10);
              parts.push(
                <button
                  key={`li-btn-cite-${index}-${match.index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToPage) onNavigateToPage(pageNum);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-0.5 px-1.5 rounded-md text-xs mx-0.5 align-middle cursor-pointer transition-colors duration-150 border border-gray-300"
                  title={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>,
              );
              lastIndex = citationRegex.lastIndex;
            }
            if (lastIndex < text.length) {
              parts.push(text.substring(lastIndex));
            }
            return parts.length > 0 ? (
              <Fragment key={`li-frag-${index}`}>
                {parts.map((p, i) => (
                  <Fragment key={i}>{p}</Fragment>
                ))}
              </Fragment>
            ) : (
              text
            );
          }
          return child;
        },
      );
      return <li className={props.className}>{childrenWithCitations}</li>;
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div className="w-1/2 h-full flex flex-col">
      <div
        className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        ref={scrollRef}
      >
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div
                className={`${message.role === "assistant" ? "max-w-[90%]" : "max-w-[80%]"} p-4 rounded-2xl transition-all duration-200 relative group ${
                  message.role === "assistant"
                    ? "self-start bg-gray-50 border border-gray-300 text-gray-800"
                    : "self-end bg-[#F2F2F2] border border-gray-300 text-gray-800"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-md w-full prose-custom">
                    <ReactMarkdown components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                    {isResponding &&
                      message.content === "" &&
                      message === messages[messages.length - 1] && (
                        <div className="w-2 h-2 bg-gray-600 rounded-md animate-growRotate" />
                      )}
                  </div>
                ) : (
                  <div className="prose prose-md w-full">
                    <span>{message.content}</span>
                  </div>
                )}
                {message.role === "assistant" && message.content !== "" && (
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CopyButton textToCopy={message.content} />
                  </div>
                )}
              </div>
              {message.role === "assistant" &&
                index === 0 &&
                questions.length > 0 &&
                showQuestions && (
                  <div className="max-w-[80%] self-start bg-white p-4 rounded-2xl mt-3 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Suggested Questions:
                    </h3>
                    <ul className="space-y-2">
                      {questions.map((question, qIndex) => (
                        <li
                          key={qIndex}
                          onClick={() => handleQuestion(question)}
                          className="bg-gray-100 p-3 text-sm rounded-lg hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors duration-200"
                        >
                          <span className="font-medium text-gray-600">
                            Q{qIndex + 1}.
                          </span>{" "}
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex border border-gray-400 bg-white">
        <button
          type="button"
          onClick={handleWebSearchToggle}
          disabled={isResponding || isProcessing}
          className={`px-4 py-4 flex items-center justify-center border-r border-gray-400 transition-colors duration-200 cursor-pointer ${
            useWebSearch
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={useWebSearch ? "Web search enabled" : "Enable web search"}
        >
          <CiGlobe className="h-5 w-5" />
        </button>
        <div className="flex-grow flex">
          <textarea
            value={query}
            onChange={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
              onQueryChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isResponding || isProcessing}
            rows={1}
            className="flex-grow resize-none overflow-hidden p-4 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
            placeholder={
              isProcessing
                ? "Processing your PDF..."
                : "Ask anything about your PDF..."
            }
          />
          {query.trim() && (
            <button
              onClick={handleSend}
              disabled={isResponding || isProcessing}
              className="px-4 py-2 bg-black text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
