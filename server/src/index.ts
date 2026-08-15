import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import queueRoutes from './routes/queue.routes.js';
import staffRoutes from './routes/staff.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import { registerSocketHandlers } from './sockets/queueSocket.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register Socket.IO Handlers & Broadcasters
registerSocketHandlers(io);

// Health check (explicitly typed req and res to fix TS7006)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'WaitWise Real-Time Server',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 WaitWise Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time Socket.IO initialized`);
});