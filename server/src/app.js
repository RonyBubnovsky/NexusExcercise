// Express app configuration.
// This file creates and configures the Express app WITHOUT starting
// the server or connecting to MongoDB. This separation is important
// because it allows tests (Supertest) to import the app directly
// without needing a running database or server.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// --- Middleware ---
app.use(helmet());         // Security headers
app.use(cors());           // Allow cross-origin requests from the frontend
app.use(express.json());   // Parse JSON request bodies

// --- Routes ---

// Health check endpoint – verifies the server is running
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
  console.log('Health check endpoint hit');
});

// Admin API – CRUD operations, protected by JWT (except login)
app.use('/api/v1/admin', adminRoutes);

// Reseller API – public product listing + purchase, protected by API key
app.use('/api/v1/products', productRoutes);

// --- Global Error Handler (must be LAST middleware) ---
app.use(errorHandler);

module.exports = app;
