"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onTyping, 
  onStopTyping,
  disabled = false 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message);
    setMessage("");
    
    // Stop typing indicator
    if (isTyping) {
      onStopTyping();
      setIsTyping(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, 120); // Max 5 lines
      textarea.style.height = scrollHeight + 'px';
    }

    // Handle typing indicators
    if (value.trim() && !disabled) {
      if (!isTyping) {
        onTyping();
        setIsTyping(true);
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          onStopTyping();
          setIsTyping(false);
        }
      }, 3000);
    } else if (isTyping) {
      onStopTyping();
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className="border-t bg-white p-4 safe-area-padding-bottom">
      <div className="flex items-end gap-3 max-w-full">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            disabled={disabled}
            className={`
              w-full px-4 py-3 pr-12 rounded-2xl border-2 resize-none overflow-y-auto
              ${disabled 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white'
              }
              text-sm leading-5 placeholder-gray-500
              transition-all duration-200
              outline-none
            `}
            rows={1}
            maxLength={1000}
            style={{
              minHeight: '48px',
              maxHeight: '120px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          />
          
          {/* Character counter for long messages */}
          {message.length > 800 && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            h-12 w-12 rounded-full flex-shrink-0 p-0
            ${canSend 
              ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700' 
              : 'bg-gray-300 cursor-not-allowed'
            }
            transition-all duration-200 touch-manipulation
          `}
          aria-label="Send message"
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg 
              className="w-5 h-5 text-white transform rotate-90" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </Button>
      </div>

      {/* Quick actions or emoji panel could go here */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {disabled && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              Reconnecting...
            </span>
          )}
        </div>
        
        <div className="text-right">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}