// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static assets from the "public" folder
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // When a client joins a room, add them and notify others
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // When a user initiates a call, notify the target user
  socket.on('initiate-call', (data) => {
    io.to(data.target).emit('incoming-call', {
      callerId: socket.id,
      roomId: data.roomId
    });
  });

  // Handle accepting an incoming call
  socket.on('accept-call', (data) => {
    io.to(data.callerId).emit('call-accepted', { roomId: data.roomId });
  });

  // Handle rejecting an incoming call
  socket.on('reject-call', (data) => {
    io.to(data.callerId).emit('call-rejected');
  });

  // Relay signaling messages: offer, answer, and ICE candidates
  socket.on('signal', (data) => {
    io.to(data.target).emit('signal', {
      signal: data.signal,
      sender: socket.id,
    });
  });

  // Optional chat message relaying
  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('chat-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StenoCall signaling server listening on port ${PORT}`);
});
