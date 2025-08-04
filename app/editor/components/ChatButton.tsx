"use client";

import { Bot } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
}

const ChatButton = ({ onClick, hasUnread = false }: ChatButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 p-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      title="Chat with AI Assistant"
    >
      <Bot className="w-6 h-6" />
      {hasUnread && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
      )}
    </button>
  );
};

export default ChatButton;
