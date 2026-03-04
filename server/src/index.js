// Entry point for the Coupon Marketplace backend server.
// Loads environment variables, connects to MongoDB, and starts Express.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

// Load environment variables from .env file
require("dotenv").config();

const app = express();

// --- Middleware ---
app.use(helmet()); // Security headers
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json()); // Parse JSON request bodies

// --- Routes ---

// Health check endpoint – verifies the server is running
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- MongoDB Connection & Server Start ---

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/coupon-marketplace";

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

startServer();

// Export app for testing (Supertest needs access to the Express app)
module.exports = app;
