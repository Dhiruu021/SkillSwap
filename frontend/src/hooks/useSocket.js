import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../state/AuthContext.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket']
    });
    socketRef.current = socket;

    if (user?._id || user?.id) {
      socket.emit('authenticate', { userId: user._id || user.id });
    }

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return { socket: socketRef.current, onlineUsers };
};

