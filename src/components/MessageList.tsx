"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { Message } from "@/app/page";

interface MessageListProps {
  messages: Message[];
  currentUsername: string;
}

export default function MessageList({ messages, currentUsername }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    // Future: Implement pull-to-refresh for message history
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      // Load more messages logic can be added here
      console.log("Reached top - could load more messages");
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Welcome to ChatApp!</h3>
          <p className="text-gray-600 text-sm">
            Start a conversation by typing a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
      onScroll={handleScroll}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
      }}
    >
      {messages.map((message, index) => {
        const isFirstFromUser = index === 0 || messages[index - 1].username !== message.username;
        const isLastFromUser = index === messages.length - 1 || messages[index + 1].username !== message.username;
        
        return (
          <ChatMessage
            key={message.id}
            message={message}
            isOwn={message.username === currentUsername}
            showUsername={isFirstFromUser && message.type === 'message'}
            isFirst={isFirstFromUser}
            isLast={isLastFromUser}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}