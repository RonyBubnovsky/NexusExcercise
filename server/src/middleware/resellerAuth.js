// Reseller Auth Middleware – protects all /api/v1/products/* routes.
// Validates the Bearer token against the RESELLER_API_KEY env var.
// This is a simple API key check (not JWT) – resellers receive their
// key from the admin and include it in every request.

const AppError = require('../utils/AppError');

const resellerAuth = (req, res, next) => {
  // Extract token from "Authorization: Bearer <api_key>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  // Compare against the API key stored in environment variables
  if (token !== process.env.RESELLER_API_KEY) {
    return next(new AppError('Invalid API key', 401, 'UNAUTHORIZED'));
  }

  next();
};

module.exports = resellerAuth;
