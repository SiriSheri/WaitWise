import { Server, Socket } from 'socket.io';
import { QueueState } from '../types/index.js';

let ioInstance: Server | null = null;

export function setSocketIOInstance(io: Server) {
  ioInstance = io;
}

export function registerSocketHandlers(io: Server) {
  setSocketIOInstance(io);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_business', (businessId: string) => {
      if (businessId) {
        socket.join(`business_${businessId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined business_${businessId}`);
      }
    });

    socket.on('leave_business', (businessId: string) => {
      if (businessId) {
        socket.leave(`business_${businessId}`);
      }
    });

    socket.on('join_ticket', (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket_${ticketId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined ticket_${ticketId}`);
      }
    });

    socket.on('leave_ticket', (ticketId: string) => {
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
      }
    });

    socket.on('join_user', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastQueueUpdate(businessId: string, state: QueueState) {
  if (!ioInstance) return;
  ioInstance.to(`business_${businessId}`).emit('queue_updated', state);

  // Also broadcast to individual ticket rooms for active tickets
  for (const entry of state.waitingQueue) {
    ioInstance.to(`ticket_${entry.id}`).emit('ticket_state_change', entry);
  }
  for (const entry of state.currentlyServing) {
    ioInstance.to(`ticket_${entry.id}`).emit('ticket_state_change', entry);
  }
}

export function broadcastTicketCalled(
  businessId: string,
  data: {
    ticketId: string;
    ticketNumber: string;
    customerName: string;
    counterName: string;
  }
) {
  if (!ioInstance) return;
  // Broadcast to whole business room (for big screens / waiting room boards)
  ioInstance.to(`business_${businessId}`).emit('ticket_called', data);
  // Broadcast specifically to the user's ticket room with high priority
  ioInstance.to(`ticket_${data.ticketId}`).emit('your_turn_now', data);
}

export function sendNotificationToUser(userId: string, notification: any) {
  if (!ioInstance) return;
  ioInstance.to(`user_${userId}`).emit('new_notification', notification);
}
