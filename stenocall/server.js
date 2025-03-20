// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static assets from the public folder
app.use(express.static('public'));

// Socket.IO signaling: handling room joins and relaying WebRTC signals.
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // When the client joins a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Inform other clients in this room that a new user has connected
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Relay signaling data (offer, answer, ICE candidates) between peers
  socket.on('signal', (data) => {
    // data: { roomId, signal, target }
    io.to(data.target).emit('signal', {
      signal: data.signal,
      sender: socket.id,
    });
  });

  // Handle chat messages in the room
  socket.on('chat-message', (data) => {
    // data: { roomId, message }
    io.to(data.roomId).emit('chat-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Here you could notify others that a user left the room
  });
});

// Start the server on the provided PORT or 3000 by default
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StenoCall signaling server listening on port ${PORT}`);
});
