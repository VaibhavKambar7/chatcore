import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

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
        className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        ref={scrollRef}
      >
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div
                className={`max-w-[80%] p-4 rounded-2xl transition-all duration-200 ${
                  message.role === "assistant"
                    ? "self-start bg-gray-50 border border-gray-300 text-gray-800"
                    : "self-end bg-[#F2F2F2] border border-gray-300 text-gray-800"
                }`}
              >
                <div>
                  {message.role === "assistant" ? (
                    <>
                      <div className="prose prose-md w-full">
                        <div className="flex items-center gap-2">
                          {/* {isProcessing &&
                            message === messages[messages.length - 1] && (
                              <div className="w-2 h-2 bg-gray-600 rounded-md animate-growRotate"></div>
                            )} */}
                          <div className="flex-grow">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>

                        {isResponding &&
                          message === messages[messages.length - 1] && (
                            <div className="w-2 h-2 bg-gray-600 rounded-md animate-growRotate" />
                          )}
                      </div>
                    </>
                  ) : (
                    <div className="prose prose-md w-full">
                      <span>{message.content}</span>
                    </div>
                  )}
                </div>
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
      <div
        className={`flex border ${isProcessing ? "border-gray-300" : "border-gray-400"}`}
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
              ? "Processing your PDF..."
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
