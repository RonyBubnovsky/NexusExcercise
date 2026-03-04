// Global error handling middleware.
// This is the LAST middleware in the Express chain.
// It catches all errors (thrown or passed via next(err)) and sends
// a standardized JSON response matching the API spec:
//
//   { "error_code": "ERROR_NAME", "message": "Human readable message" }
//

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If it's our custom AppError, use its status code and error code
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log the error for debugging (but not in tests to keep output clean)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${errorCode}: ${message}`);
  }

  res.status(statusCode).json({
    error_code: errorCode,
    message: message,
  });
};

module.exports = errorHandler;
