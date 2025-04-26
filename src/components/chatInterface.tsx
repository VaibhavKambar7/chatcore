import { PiSpinnerBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  query: string;
  isResponding: boolean;
  onQueryChange: (query: string) => void;
  onSend: () => void;
}

export function ChatInterface({
  messages,
  query,
  isResponding,
  onQueryChange,
  onSend,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-1/2 h-full flex flex-col">
      <div
        className="flex-grow overflow-y-auto p-4 scrollbar-hide"
        ref={scrollRef}
      >
        <div className="p-4 flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[80%] p-3 inline-block text-grey-100 border-1 border-gray-500 ${
                message.role === "assistant"
                  ? "self-start bg-gray-100 text-black"
                  : "self-end bg-black text-white"
              }`}
            >
              <div className="prose dark:prose-invert prose-lg w-full">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="self-start max-w-[80%] p-3 flex flex-row justify-center items-center bg-gray-100 border-1 border-gray-500">
              <PiSpinnerBold className="animate-spin text-xl inline-block text-gray-600 mr-2" />
              <div className="text-gray-600">Thinking...</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex border border-black">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
          disabled={isResponding}
          className="flex-grow p-4 focus:outline-none"
          placeholder="Ask anything about your PDF..."
        />
        {query && (
          <button
            onClick={onSend}
            disabled={isResponding}
            className="px-4 py-2 bg-black text-white font-semibold disabled:bg-gray-400"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
