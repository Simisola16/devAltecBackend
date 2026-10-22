import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import trackRoutes from './routes/trackRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import inquiryRoutes from './routes/inquiryRoutes';

// Resolve .env robustly across working directories
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or localhost
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
        return;
      }
      callback(null, true); // Permissive for client tracking across domains
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy headers (crucial for accurate visitor IP behind Nginx/Vercel/Render)
app.set('trust proxy', true);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'devAltec Analytics & Project Intake Engine',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      track: '/api/track',
      analytics: '/api/analytics/summary',
      inquiries: '/api/inquiries',
    },
  });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'devAltec Analytics & Tracking Engine',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/track', trackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inquiries', inquiryRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start Server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[devAltec Backend] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[devAltec Backend] MongoDB connected to cluster: devaltecv.zhhbtid.mongodb.net`);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

export default app;
