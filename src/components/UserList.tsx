"use client";

import { User } from "@/app/page";

interface UserListProps {
  users: User[];
  currentUsername: string;
  onClose: () => void;
}

export default function UserList({ users, currentUsername, onClose }: UserListProps) {
  const formatLastSeen = (date?: Date) => {
    if (!date) return "Never";
    
    const now = new Date();
    const lastSeen = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Users ({users.length})
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
          aria-label="Close user list"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Online ({onlineUsers.length})
            </h3>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-colors
                    ${user.username === currentUsername 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 truncate">
                        {user.username}
                      </p>
                      {user.username === currentUsername && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-600">
                      Online
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Offline ({offlineUsers.length})
            </h3>
            <div className="space-y-2">
              {offlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-600 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last seen {formatLastSeen(user.lastSeen)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No users online</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Real-time user status
        </p>
      </div>
    </div>
  );
}