// Admin Auth Middleware – protects all /api/v1/admin/* routes.
// Extracts the JWT from the Authorization header, verifies it using
// authService, and checks that the token has the 'admin' role.
// If any check fails, returns 401 Unauthorized.

const authService = require('../services/authService');
const AppError = require('../utils/AppError');

const adminAuth = (req, res, next) => {
  try {
    // Extract token from "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT and check the role
    const payload = authService.verifyToken(token);

    if (payload.role !== 'admin') {
      throw new AppError('Admin access required', 401, 'UNAUTHORIZED');
    }

    // Attach the decoded payload to the request for downstream use
    req.admin = payload;
    next();
  } catch (error) {
    // If it's already an AppError, pass it through
    if (error.errorCode) {
      return next(error);
    }
    // Otherwise, wrap it as UNAUTHORIZED
    next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
};

module.exports = adminAuth;
