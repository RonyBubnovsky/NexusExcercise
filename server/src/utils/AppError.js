// Custom error class for the application.
// Extends the built-in Error to include an HTTP status code and error code.
// This lets us throw errors anywhere in the code and have them handled
// consistently by the global error handler middleware.

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (e.g., 400, 404, 409)
   * @param {string} errorCode - Machine-readable error code (e.g., 'PRODUCT_NOT_FOUND')
   */
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = AppError;
