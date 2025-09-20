// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');

// Create Express application 
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connection MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error)
    });

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Authentication Backend API',
        status: 'running',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/me',
            health: 'GET /health'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState == 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start serve
const PORT = process.env.PORT || 3001;
app.listen (PORT, () => {
    console.log(`Auth Backend running on http://localhost:${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}`);;

});