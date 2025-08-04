"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { useAutomationContext } from "../context/AutomationContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const ChatPanel = ({ isOpen, onClose }: ChatPanelProps) => {
  const {
    nodes,
    edges,
    selectedNode,
    getTriggerIntegrations,
    getActionIntegrations,
    getLogicIntegrations,
    addWorkflowFromAI,
  } = useAutomationContext();

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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build workflow context for AI
  const buildWorkflowContext = () => {
    const triggers = getTriggerIntegrations();
    const actions = getActionIntegrations();
    const logic = getLogicIntegrations();

    return `
Available integrations:
Triggers: ${triggers.map((t) => t.name).join(", ")}
Actions: ${actions.map((a) => a.name).join(", ")}
Logic: ${logic.map((l) => l.name).join(", ")}

Current workflow: ${nodes.length} nodes, ${edges.length} connections
${
  selectedNode
    ? `Selected: ${selectedNode.data.label || selectedNode.data.subtype}`
    : "No node selected"
}
Execution state: ${nodes.length > 0 ? "Ready to execute" : "Empty workflow"}
`;
  };

  const extractWorkflowConfiguration = (response: string) => {
    const match = response.match(
      /<CREATE_WORKFLOW>([\s\S]*?)<\/CREATE_WORKFLOW>/
    );
    if (!match) return null;

    try {
      return JSON.parse(match[1]);
    } catch (error) {
      console.error("Failed to parse workflow configuration:", error);
      return null;
    }
  };

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
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
          workflowContext: buildWorkflowContext(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Check if AI wants to create a workflow
      const workflowConfig = extractWorkflowConfiguration(data.response);
      if (workflowConfig) {
        addWorkflowFromAI(workflowConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div
      className={`
        bg-[var(--card)] border-l border-[var(--border)] flex flex-col z-[60]
        ${isOpen ? "w-80 sm:w-96 md:w-[28rem]" : "w-0 overflow-hidden"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 bg-[var(--primary)] rounded-lg flex-shrink-0">
            <Bot className="w-5 h-5 text-[var(--primary-foreground)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">
              AI Assistant
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
              Automation helper
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
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
      <div className="p-2 sm:p-4 border-t border-[var(--border)]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 min-w-0 px-3 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-2 sm:px-3 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-10 sm:w-auto flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
