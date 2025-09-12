import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// In-memory storage for demo purposes
const connectedUsers = new Map<string, { id: string; username: string; socketId: string }>();
const messageHistory: any[] = [];
const MAX_MESSAGE_HISTORY = 100;

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? false // In production, same-origin only
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user joining
      socket.on('join', ({ username }) => {
        console.log(`${username} joined the chat`);
        
        // Store user info
        const userId = Date.now().toString();
        connectedUsers.set(socket.id, {
          id: userId,
          username,
          socketId: socket.id,
        });

        // Join user to the main chat room
        socket.join('main-chat');

        // Send message history to the new user
        socket.emit('messageHistory', messageHistory);

        // Send current user list
        const userList = Array.from(connectedUsers.values()).map(user => ({
          id: user.id,
          username: user.username,
          isOnline: true,
        }));
        
        io.to('main-chat').emit('userList', userList);

        // Broadcast user joined event
        socket.broadcast.to('main-chat').emit('userJoined', {
          id: userId,
          username,
          isOnline: true,
        });

        // Send system message about user joining
        const joinMessage = {
          id: Date.now().toString(),
          username: 'System',
          content: `${username} joined the chat`,
          timestamp: new Date(),
          type: 'system',
        };

        socket.broadcast.to('main-chat').emit('message', joinMessage);
      });

      // Handle sending messages
      socket.on('sendMessage', ({ content, username, timestamp }) => {
        const message = {
          id: Date.now().toString(),
          username,
          content,
          timestamp: new Date(timestamp),
          type: 'message',
        };

        // Add to message history
        messageHistory.push(message);
        
        // Keep only the latest messages
        if (messageHistory.length > MAX_MESSAGE_HISTORY) {
          messageHistory.splice(0, messageHistory.length - MAX_MESSAGE_HISTORY);
        }

        // Broadcast message to all users in the chat
        io.to('main-chat').emit('message', message);
      });

      // Handle typing indicators
      socket.on('typing', (username) => {
        socket.broadcast.to('main-chat').emit('userTyping', username);
      });

      socket.on('stopTyping', (username) => {
        socket.broadcast.to('main-chat').emit('userStoppedTyping', username);
      });

      // Handle user disconnection
      socket.on('disconnect', (reason) => {
        console.log('User disconnected:', socket.id, 'Reason:', reason);
        
        const user = connectedUsers.get(socket.id);
        if (user) {
          // Remove user from connected users
          connectedUsers.delete(socket.id);

          // Send updated user list
          const userList = Array.from(connectedUsers.values()).map(u => ({
            id: u.id,
            username: u.username,
            isOnline: true,
          }));
          
          socket.broadcast.to('main-chat').emit('userList', userList);

          // Broadcast user left event
          socket.broadcast.to('main-chat').emit('userLeft', {
            id: user.id,
            username: user.username,
            isOnline: false,
            lastSeen: new Date(),
          });

          // Send system message about user leaving
          const leaveMessage = {
            id: Date.now().toString(),
            username: 'System',
            content: `${user.username} left the chat`,
            timestamp: new Date(),
            type: 'system',
          };

          socket.broadcast.to('main-chat').emit('message', leaveMessage);
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  res.end();
}

// Configuration to enable WebSocket support
export const config = {
  api: {
    bodyParser: false,
  },
};