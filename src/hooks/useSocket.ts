'use client';

import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocketContext } from '@/contexts/SocketContext';

interface Message {
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

interface OrderStatus {
  orderId: string;
  status: string;
  updatedAt: string;
}

interface Notification {
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

interface ProductChange {
  productId: string;
  inventory?: number;
  price?: number;
  updatedAt: string;
}

export const useSocket = () => {
  const { socket, isConnected, onlineUsers } = useSocketContext();

  const joinRoom = useCallback((room: string) => {
    if (socket) {
      socket.emit('joinRoom', room);
    }
  }, [socket]);

  const leaveRoom = useCallback((room: string) => {
    if (socket) {
      socket.emit('leaveRoom', room);
    }
  }, [socket]);

  const joinOrderRoom = useCallback((orderId: string) => {
    if (socket) {
      socket.emit('joinOrderRoom', orderId);
    }
  }, [socket]);

  const leaveOrderRoom = useCallback((orderId: string) => {
    if (socket) {
      socket.emit('leaveOrderRoom', orderId);
    }
  }, [socket]);

  const sendMessage = useCallback((room: string, message: string, senderId: string, senderName: string) => {
    if (socket) {
      socket.emit('sendMessage', { room, message, senderId, senderName });
    }
  }, [socket]);

  const sendOrderUpdate = useCallback((orderId: string, status: string, userId?: string) => {
    if (socket) {
      socket.emit('orderUpdate', { orderId, status, userId });
    }
  }, [socket]);

  const sendProductUpdate = useCallback((productId: string, inventory?: number, price?: number) => {
    if (socket) {
      socket.emit('productUpdate', { productId, inventory, price });
    }
  }, [socket]);

  const sendNotification = useCallback((userId: string, type: string, title: string, message: string) => {
    if (socket) {
      socket.emit('notification', { userId, type, title, message });
    }
  }, [socket]);

  const sendTyping = useCallback((room: string, userId: string, userName: string) => {
    if (socket) {
      socket.emit('typing', { room, userId, userName });
    }
  }, [socket]);

  const sendStopTyping = useCallback((room: string, userId: string) => {
    if (socket) {
      socket.emit('stopTyping', { room, userId });
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    joinOrderRoom,
    leaveOrderRoom,
    sendMessage,
    sendOrderUpdate,
    sendProductUpdate,
    sendNotification,
    sendTyping,
    sendStopTyping,
  };
};

export const useChatMessages = (room: string) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket || !room) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, room]);

  return messages;
};

export const useOrderUpdates = (orderId?: string) => {
  const { socket } = useSocket();
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!socket) return;

    if (orderId) {
      socket.emit('joinOrderRoom', orderId);
    }

    const handleOrderUpdate = (data: OrderStatus) => {
      setOrderStatus(data);
    };

    socket.on('orderStatusChanged', handleOrderUpdate);

    return () => {
      if (orderId) {
        socket.emit('leaveOrderRoom', orderId);
      }
      socket.off('orderStatusChanged', handleOrderUpdate);
    };
  }, [socket, orderId]);

  return orderStatus;
};

export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket]);

  const clearNotifications = () => setNotifications([]);

  return { notifications, clearNotifications };
};

export const useProductUpdates = () => {
  const { socket } = useSocket();
  const [productChanges, setProductChanges] = useState<ProductChange | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleProductChange = (data: ProductChange) => {
      setProductChanges(data);
    };

    socket.on('productChanged', handleProductChange);

    return () => {
      socket.off('productChanged', handleProductChange);
    };
  }, [socket]);

  return productChanges;
};

export const useTypingStatus = (room: string) => {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);

  useEffect(() => {
    if (!socket || !room) return;

    const handleTyping = ({ userId, userName }: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, userName }];
      });
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('userTyping', handleTyping);
    socket.on('userStoppedTyping', handleStopTyping);

    return () => {
      socket.off('userTyping', handleTyping);
      socket.off('userStoppedTyping', handleStopTyping);
    };
  }, [socket, room]);

  return typingUsers;
};
