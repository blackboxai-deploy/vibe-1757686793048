import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory user storage (in production, use a database)
const users = new Map<string, {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: string;
  joinedAt: string;
}>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get all users
      const userList = Array.from(users.values());
      
      return res.status(200).json({
        success: true,
        data: {
          users: userList,
          online: userList.filter(user => user.isOnline).length,
          total: userList.length,
        },
      });

    case 'POST':
      // Add or update a user
      try {
        const { username, isOnline = true } = req.body;

        if (!username) {
          return res.status(400).json({
            success: false,
            error: 'Username is required',
          });
        }

        // Check if username already exists
        const existingUser = Array.from(users.values())
          .find(user => user.username.toLowerCase() === username.toLowerCase());

        if (existingUser && isOnline) {
          return res.status(409).json({
            success: false,
            error: 'Username already taken',
          });
        }

        const userId = existingUser?.id || Date.now().toString();
        const user = {
          id: userId,
          username,
          isOnline,
          lastSeen: new Date().toISOString(),
          joinedAt: existingUser?.joinedAt || new Date().toISOString(),
        };

        users.set(userId, user);

        return res.status(200).json({
          success: true,
          data: { user },
        });
      } catch (error) {
        console.error('Error managing user:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to manage user',
        });
      }

    case 'PUT':
      // Update user status
      try {
        const { userId, isOnline } = req.body;

        if (!userId || typeof isOnline !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'User ID and online status are required',
          });
        }

        const user = users.get(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
          });
        }

        user.isOnline = isOnline;
        user.lastSeen = new Date().toISOString();
        users.set(userId, user);

        return res.status(200).json({
          success: true,
          data: { user },
        });
      } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update user status',
        });
      }

    case 'DELETE':
      // Remove a user
      try {
        const { userId } = req.query;

        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'User ID is required',
          });
        }

        const deleted = users.delete(userId as string);
        
        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'User removed successfully',
        });
      } catch (error) {
        console.error('Error removing user:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to remove user',
        });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
      });
  }
}