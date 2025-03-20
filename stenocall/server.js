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

  // Watch for a client joining a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Relay signaling data (offer, answer, ICE candidates)
  socket.on('signal', (data) => {
    // data: { roomId, signal, target }
    io.to(data.target).emit('signal', {
      signal: data.signal,
      sender: socket.id,
    });
  });

  // Relay chat messages (optional)
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
