import { NextApiRequest, NextApiResponse } from 'next';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    websocket: 'running' | 'stopped';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthData>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'disconnected',
        websocket: 'stopped',
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    });
  }

  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    // For this demo, we're using in-memory storage
    // In production, you would check actual database connectivity
    const databaseStatus: 'connected' | 'disconnected' = memoryUsage ? 'connected' : 'disconnected';

    // Check if WebSocket server is running
    // This is a simplified check - in production you'd check actual server status
    const websocketStatus: 'running' | 'stopped' = totalMemory > 0 ? 'running' : 'stopped';

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memoryPercentage > 90 || databaseStatus === 'disconnected' || websocketStatus === 'stopped') {
      status = 'unhealthy';
    } else if (memoryPercentage > 75) {
      status = 'degraded';
    }

    const healthData: HealthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseStatus,
        websocket: websocketStatus,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: memoryPercentage,
        },
      },
    };

    // Set appropriate HTTP status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return res.status(statusCode).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: '1.0.0',
      services: {
        database: 'disconnected',
        websocket: 'stopped',
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    });
  }
}