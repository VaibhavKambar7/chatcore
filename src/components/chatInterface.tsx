import { PiSpinnerBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";

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
  onSend: (query: string) => void;
  questions: string[];
  showQuestions: boolean;
  setShowQuestions: React.Dispatch<React.SetStateAction<boolean>>;
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
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuestion = (question: string) => {
    if (isResponding || isProcessing) return;
    onQueryChange(question);
    setShowQuestions(false);
    onSend(question);
  };

  return (
    <div className="w-1/2 h-full flex flex-col">
      <div
        className="flex-grow overflow-y-auto p-4 scrollbar-hide"
        ref={scrollRef}
      >
        <div className="p-4 flex flex-col gap-4">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div
                className={`max-w-[80%] p-3 inline-block text-grey-100 border-1 border-gray-500 ${
                  message.role === "assistant"
                    ? "self-start bg-gray-100 text-black"
                    : "self-end bg-black text-white"
                }`}
              >
                <div>
                  {message.isProcessing ? (
                    <div className="flex items-center">
                      <PiSpinnerBold className="animate-spin text-xl mr-2 text-gray-600" />
                      <span className="text-gray-600">{message.content}</span>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert prose-lg w-full">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
              {message.role === "assistant" &&
                index === 0 &&
                questions.length > 0 &&
                showQuestions && (
                  <div className="max-w-[80%] self-start bg-gray-50 p-2 rounded-none mt-2 border-1 border-gray-300">
                    <h3 className="text-sm font-semibold mb-1">
                      Suggested Questions:
                    </h3>
                    <ul className="space-y-1">
                      {questions.map((question, qIndex) => (
                        <li
                          key={qIndex}
                          onClick={() => handleQuestion(question)}
                          className="bg-gray-200 p-2 rounded-none hover:bg-gray-300 hover:text-black hover:cursor-pointer"
                        >
                          <span className="font-medium">Q{qIndex + 1}. </span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
      <div
        className={`flex border ${isProcessing ? "border-gray-300" : "border-black"}`}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend(query);
            }
          }}
          disabled={isResponding || isProcessing}
          className="flex-grow p-4 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={
            isProcessing
              ? "Processing PDF..."
              : "Ask anything about your PDF..."
          }
        />
        {query && (
          <button
            onClick={() => onSend(query)}
            disabled={isResponding || isProcessing}
            className="px-4 py-2 bg-black text-white font-semibold disabled:bg-gray-400 cursor-pointer"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
