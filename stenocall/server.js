// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static assets from the "public" folder
app.use(express.static('public'));

// When a client connects
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room event: clients send their room ID.
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Notify other clients in the room that a new user has connected.
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Relay signaling data (offer, answer, ICE candidates)
  socket.on('signal', (data) => {
    // Data format: { roomId, signal, target }
    io.to(data.target).emit('signal', {
      signal: data.signal,
      sender: socket.id
    });
  });

  // Relay chat messages (optional)
  socket.on('chat-message', (data) => {
    // Data format: { roomId, message }
    io.to(data.roomId).emit('chat-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Optionally notify other room members here.
  });
});

// Start the server on port 3000 (or the PORT env variable)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StenoCall signaling server listening on port ${PORT}`);
});
