import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory message storage (in production, use a database)
let messages: any[] = [];
const MAX_MESSAGES = 1000;

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get message history
      const { limit = '50', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const paginatedMessages = messages
        .slice(-limitNum - offsetNum, messages.length - offsetNum)
        .reverse();

      return res.status(200).json({
        success: true,
        data: {
          messages: paginatedMessages,
          total: messages.length,
          hasMore: messages.length > limitNum + offsetNum,
        },
      });

    case 'POST':
      // Add a new message (for fallback when WebSocket isn't available)
      try {
        const { username, content, type = 'message' } = req.body;

        if (!username || !content) {
          return res.status(400).json({
            success: false,
            error: 'Username and content are required',
          });
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          username,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          type,
        };

        // Add message to storage
        messages.push(newMessage);

        // Keep only the latest messages
        if (messages.length > MAX_MESSAGES) {
          messages = messages.slice(-MAX_MESSAGES);
        }

        return res.status(201).json({
          success: true,
          data: { message: newMessage },
        });
      } catch (error) {
        console.error('Error adding message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add message',
        });
      }

    case 'DELETE':
      // Clear message history (admin function)
      try {
        messages = [];
        return res.status(200).json({
          success: true,
          message: 'Message history cleared',
        });
      } catch (error) {
        console.error('Error clearing messages:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to clear messages',
        });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
      });
  }
}