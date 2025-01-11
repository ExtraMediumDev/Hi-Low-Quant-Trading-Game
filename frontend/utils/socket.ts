import io from 'socket.io-client';

// Create a function to get or initialize the socket
let socket: any = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('ws://10.1.5.29:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};