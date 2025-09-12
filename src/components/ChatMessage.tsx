"use client";

import { Message } from "@/app/page";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showUsername?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function ChatMessage({ 
  message, 
  isOwn, 
  showUsername = false,
  isFirst = false,
  isLast = false 
}: ChatMessageProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();
    
    if (isToday) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } else {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {showUsername && !isOwn && (
          <div className="text-xs text-gray-600 mb-1 ml-3 font-medium">
            {message.username}
          </div>
        )}
        
        <div
          className={`
            px-4 py-2 relative break-words
            ${isOwn 
              ? 'bg-blue-500 text-white ml-auto' 
              : 'bg-white text-gray-800 border border-gray-200'
            }
            ${isFirst && isLast 
              ? 'rounded-2xl'
              : isFirst 
                ? isOwn 
                  ? 'rounded-2xl rounded-br-md'
                  : 'rounded-2xl rounded-bl-md'
                : isLast
                  ? isOwn
                    ? 'rounded-2xl rounded-tr-md'
                    : 'rounded-2xl rounded-tl-md'
                  : isOwn
                    ? 'rounded-r-2xl rounded-l-md'
                    : 'rounded-l-2xl rounded-r-md'
            }
            shadow-sm
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* Message time */}
          <div 
            className={`
              text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity
              ${isOwn ? 'text-blue-100' : 'text-gray-500'}
            `}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>
        
        {/* Delivery status for own messages */}
        {isOwn && isLast && (
          <div className="flex justify-end mt-1 mr-2">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-3 h-3 flex">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full ml-0.5"></div>
              </div>
              <span>Sent</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}