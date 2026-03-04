// Server entry point.
// Connects to MongoDB and starts listening on the configured port.
// The Express app is defined separately in app.js for testability.
// The DB connection is in config/database.js so it can be swapped easily.

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
