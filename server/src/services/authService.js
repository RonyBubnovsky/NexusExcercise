// Auth Service – handles admin authentication logic.
// Validates credentials against environment variables and issues JWTs.
// This is a service (not middleware) because it contains business logic.
// The controller calls this, and the middleware verifies the resulting JWT.

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// --- Admin Login ---
// Validates username/password against env vars.
// On success, returns a signed JWT token.
// On failure, throws UNAUTHORIZED.
// NOTE: env vars are read at call time (not import time) so tests can set them.
const loginAdmin = (username, password) => {
  // Check credentials against environment variables
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    throw new AppError('Invalid username or password', 401, 'UNAUTHORIZED');
  }

  // Generate a JWT with the admin role
  // The token expires in 24 hours for security
  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { token };
};

// --- Verify JWT ---
// Decodes and verifies a JWT token. Returns the payload if valid.
// Throws UNAUTHORIZED if the token is invalid or expired.
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
};

module.exports = {
  loginAdmin,
  verifyToken,
};
