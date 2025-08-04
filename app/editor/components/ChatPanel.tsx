"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatPanel = ({ isOpen, onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your automation assistant. I can help you build workflows, suggest integrations, and optimize your automations. What would you like to create today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getMockResponse(inputValue),
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("slack") || input.includes("notification")) {
      return "I can help you set up Slack notifications! You'll want to start with a trigger (like Manual, Webhook, or Schedule), then add a 'Send Slack Message' action. Would you like me to create a template for you?";
    }

    if (input.includes("email") || input.includes("mail")) {
      return "Email automation is great for notifications and reports. I recommend using the 'Send Email' action with dynamic content from your triggers. What kind of email workflow are you thinking about?";
    }

    if (input.includes("api") || input.includes("webhook")) {
      return "API integrations are powerful! You can use the 'API Request' action to fetch data or the 'Webhook' trigger to receive data. The key is properly mapping the data fields between steps.";
    }

    if (
      input.includes("schedule") ||
      input.includes("timer") ||
      input.includes("daily")
    ) {
      return "Scheduled workflows are perfect for recurring tasks! Use the 'Schedule' trigger with cron expressions. For daily tasks, try '0 9 * * *' for 9 AM daily. What do you want to automate?";
    }

    return "That's an interesting automation idea! I'd recommend starting with a trigger that matches your use case, then adding the necessary actions and logic steps. Would you like me to suggest a specific workflow structure?";
  };

  return (
    <div
      className={`fixed top-0 bottom-0 right-0 w-96 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ top: "var(--top-bar-height, 72px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)] rounded-lg">
            <Bot className="w-5 h-5 text-[var(--primary-foreground)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              AI Assistant
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Automation helper
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ height: "calc(100vh - var(--top-bar-height, 72px) - 160px)" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[80%] ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 ${
                  message.sender === "user" ? "ml-3" : "mr-3"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === "user"
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--muted)]"
                  }`}
                >
                  {message.sender === "user" ? (
                    <User className="w-4 h-4 text-[var(--primary-foreground)]" />
                  ) : (
                    <Bot className="w-4 h-4 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex mr-3">
              <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
            </div>
            <div className="bg-[var(--muted)] px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything about automations..."
            className="flex-1 px-4 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
