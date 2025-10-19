require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const contactsRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const companionRoutes = require('./routes/companion');
const historyRoutes = require('./routes/history');
const locationRoutes = require('./routes/location');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/history', historyRoutes);
app.use('/location', locationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Client joined session: ${sessionId}`);
  });

  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`Client left session: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection and server start
const PORT = process.env.PORT || 8080;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Sync models (use {alter: true} in development, avoid in production)
    return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    console.log('✅ Database models synchronized');
    startServer();
  })
  .catch((error) => {
    console.error('❌ Unable to connect to database:', error.message);
    console.warn('⚠️  Server will start WITHOUT database connection');
    console.warn('⚠️  Database-dependent features will not work');
    console.warn('⚠️  Please check your DATABASE_URL or DB_HOST configuration\n');
    startServer();
  });

function startServer() {
  server.listen(PORT, () => {
    console.log(`\n🚀 GuardianLink Backend Server`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready for real-time updates\n`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    sequelize.close();
    console.log('Server closed');
    process.exit(0);
  });
});
