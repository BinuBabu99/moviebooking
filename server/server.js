require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const movieRoutes = require('./routes/movieRoutes');
const showtimeRoutes = require('./routes/showtimeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const http = require('http'); // 1. Import http
const { Server } = require('socket.io'); // 2. Import Socket.io

const app = express();

const server = http.createServer(app); // 3. Create HTTP server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // match your Vite frontend URL
    methods: ["GET", "POST"]
  }
});


// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// Keep track of active timers for each client socket or showtime
const activeHolds = new Map(); // key: socket.id + showtimeId, value: { seats, timeoutId }

io.on('connection', (socket) => {
  // ... existing listeners ...

  socket.on('lock_seats_with_timer', ({ showtimeId, seats }) => {
    // Clear any existing hold for this socket
    const holdKey = `${socket.id}-${showtimeId}`;
    if (activeHolds.has(holdKey)) {
      clearTimeout(activeHolds.get(holdKey).timeoutId);
    }

    // Set a 5-minute timer (300,000 milliseconds)
    const timeoutId = setTimeout(() => {
      // Time expired! Broadcast unlock to everyone in the room
      io.to(showtimeId).emit('seats_expired', { seats });
      activeHolds.delete(holdKey);
      
      // Notify the specific user that their session expired
      socket.emit('checkout_timeout');
    }, 5 * 60 * 1000);

    activeHolds.set(holdKey, { seats, timeoutId });
  });

  // Clear timer if user successfully checks out or manually releases seats
  socket.on('clear_seat_timer', ({ showtimeId }) => {
    const holdKey = `${socket.id}-${showtimeId}`;
    if (activeHolds.has(holdKey)) {
      clearTimeout(activeHolds.get(holdKey).timeoutId);
      activeHolds.delete(holdKey);
    }
  });

  socket.on('disconnect', () => {
    // If user disconnects abruptly, release their held seats
    for (const [holdKey, data] of activeHolds.entries()) {
      if (holdKey.startsWith(socket.id)) {
        const showtimeId = holdKey.split('-')[1];
        io.to(showtimeId).emit('seats_expired', { seats: data.seats });
        clearTimeout(data.timeoutId);
        activeHolds.delete(holdKey);
      }
    }
  });
});


// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI?.trim();

if (!MONGO_URI) {
  console.error('Database configuration error: set MONGO_URI in server/.env.');
  process.exitCode = 1;
} else if (!/^mongodb(\+srv)?:\/\//.test(MONGO_URI)) {
  console.error('Database configuration error: MONGO_URI must start with mongodb:// or mongodb+srv://.');
  process.exitCode = 1;
} else {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully');
      server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Database connection error:', err.message);
      process.exitCode = 1;
    });
}