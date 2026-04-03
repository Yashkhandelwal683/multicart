import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const onlineUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      } catch (err) {
        console.log('Socket auth error:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    if (socket.userId) {
      onlineUsers.set(socket.userId, socket.id);
      io.emit('userOnline', { userId: socket.userId });
    }

    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('sendMessage', (data) => {
      const { room, message, senderId, senderName } = data;
      io.to(room).emit('newMessage', {
        message,
        senderId,
        senderName,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('orderUpdate', (data) => {
      const { orderId, status, userId } = data;
      if (userId && onlineUsers.has(userId)) {
        io.to(onlineUsers.get(userId)).emit('orderStatusChanged', {
          orderId,
          status,
          updatedAt: new Date().toISOString(),
        });
      }
      io.to(`order_${orderId}`).emit('orderStatusChanged', {
        orderId,
        status,
        updatedAt: new Date().toISOString(),
      });
    });

    socket.on('productUpdate', (data) => {
      const { productId, inventory, price } = data;
      io.emit('productChanged', {
        productId,
        inventory,
        price,
        updatedAt: new Date().toISOString(),
      });
    });

    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
    });

    socket.on('leaveOrderRoom', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('notification', (data) => {
      const { userId, type, title, message } = data;
      if (userId && onlineUsers.has(userId)) {
        io.to(onlineUsers.get(userId)).emit('newNotification', {
          type,
          title,
          message,
          createdAt: new Date().toISOString(),
        });
      }
    });

    socket.on('typing', (data) => {
      const { room, userId, userName } = data;
      socket.to(room).emit('userTyping', { userId, userName });
    });

    socket.on('stopTyping', (data) => {
      const { room, userId } = data;
      socket.to(room).emit('userStoppedTyping', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('userOffline', { userId: socket.userId });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!global.io) {
    throw new Error('Socket.io not initialized');
  }
  return global.io;
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
