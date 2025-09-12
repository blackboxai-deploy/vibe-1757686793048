"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthProps {
  onLogin: (username: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Store username in localStorage for persistence
    localStorage.setItem("chatUsername", username.trim());
    onLogin(username.trim());
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-sm shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Welcome to ChatApp</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your username to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0"
                maxLength={20}
                autoComplete="off"
                autoFocus
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-3 text-lg font-medium rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors"
              disabled={!username.trim() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </div>
              ) : (
                "Join Chat"
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Real-time chat • Mobile optimized • Works offline
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}