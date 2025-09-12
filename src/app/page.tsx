"use client";

import { useState, useEffect } from "react";
import Auth from "@/components/Auth";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import UserList from "@/components/UserList";
import TypingIndicator from "@/components/TypingIndicator";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { initializeSocket, disconnectSocket } from "@/lib/socket";

export interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system';
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export default function ChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    // Check for stored username on mount
    const storedUsername = localStorage.getItem("chatUsername");
    if (storedUsername) {
      handleLogin(storedUsername);
    }
  }, []);

  const handleLogin = async (loginUsername: string) => {
    setUsername(loginUsername);
    setIsAuthenticated(true);

    // Initialize socket connection
    const socket = initializeSocket(loginUsername);
    
    if (socket) {
      // Connection status
      socket.on("connect", () => {
        console.log("Connected to chat server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from chat server");
        setIsConnected(false);
      });

      // Message handling
      socket.on("message", (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on("messageHistory", (history: Message[]) => {
        setMessages(history);
      });

      // User management
      socket.on("userList", (userList: User[]) => {
        setUsers(userList);
      });

      socket.on("userJoined", (user: User) => {
        setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
        const systemMessage: Message = {
          id: Date.now().toString(),
          username: "System",
          content: `${user.username} joined the chat`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      socket.on("userLeft", (user: User) => {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        const systemMessage: Message = {
          id: Date.now().toString(),
          username: "System",
          content: `${user.username} left the chat`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      // Typing indicators
      socket.on("userTyping", (typingUsername: string) => {
        if (typingUsername !== loginUsername) {
          setTypingUsers(prev => [...new Set([...prev, typingUsername])]);
        }
      });

      socket.on("userStoppedTyping", (typingUsername: string) => {
        setTypingUsers(prev => prev.filter(u => u !== typingUsername));
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUsername");
    disconnectSocket();
    setIsAuthenticated(false);
    setUsername("");
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    setIsConnected(false);
  };

  const handleSendMessage = (content: string) => {
    const socket = initializeSocket();
    if (socket && content.trim()) {
      socket.emit("sendMessage", {
        content: content.trim(),
        username,
        timestamp: new Date()
      });
    }
  };

  const handleTyping = () => {
    const socket = initializeSocket();
    if (socket) {
      socket.emit("typing", username);
    }
  };

  const handleStopTyping = () => {
    const socket = initializeSocket();
    if (socket) {
      socket.emit("stopTyping", username);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <PWAInstallPrompt />
      
      {/* Header */}
      <header className="bg-blue-500 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold">ChatApp</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="opacity-90">
                {isConnected ? `${users.length} online` : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-2 rounded-lg bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Toggle user list"
          >
            <div className="w-5 h-5 flex flex-col gap-1">
              <div className="w-full h-0.5 bg-white rounded"></div>
              <div className="w-full h-0.5 bg-white rounded"></div>
              <div className="w-full h-0.5 bg-white rounded"></div>
            </div>
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/10 active:bg-white/20 transition-colors text-sm"
            aria-label="Logout"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <MessageList messages={messages} currentUsername={username} />
          <TypingIndicator typingUsers={typingUsers} />
          <ChatInput 
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            disabled={!isConnected}
          />
        </div>

        {/* User List Sidebar - Mobile Overlay */}
        {showUserList && (
          <>
            <div 
              className="absolute inset-0 bg-black/50 z-40"
              onClick={() => setShowUserList(false)}
            />
            <div className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 transform transition-transform">
              <UserList 
                users={users} 
                currentUsername={username}
                onClose={() => setShowUserList(false)}
              />
            </div>
          </>
        )}
      </div>

      {/* Current User Info */}
      <div className="bg-gray-100 px-4 py-2 border-t">
        <p className="text-sm text-gray-600 text-center">
          Signed in as <span className="font-medium text-gray-800">{username}</span>
        </p>
      </div>
    </>
  );
}