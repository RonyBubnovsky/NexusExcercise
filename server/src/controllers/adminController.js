// Admin Controller – handles HTTP requests for admin operations.
// Each function is intentionally "thin":
//   1. Extract data from the request
//   2. Call the appropriate service method
//   3. Send the response
// All business logic lives in the service layer, not here.

const productService = require('../services/productService');
const authService = require('../services/authService');

// --- POST /api/v1/admin/login ---
// Authenticates the admin and returns a JWT token.
const login = (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Username and password are required',
      });
    }

    const result = authService.loginAdmin(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// --- POST /api/v1/admin/products ---
// Creates a new coupon. Admin provides all fields including pricing.
const createProduct = async (req, res, next) => {
  try {
    const coupon = await productService.createCoupon(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// --- GET /api/v1/admin/products ---
// Returns all coupons (including sold) with full internal details.
const getAllProducts = async (req, res, next) => {
  try {
    const coupons = await productService.getAllCoupons();
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

// --- GET /api/v1/admin/products/:id ---
// Returns a single coupon with full details.
const getProductById = async (req, res, next) => {
  try {
    const coupon = await productService.getCouponById(req.params.id);
    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

// --- PUT /api/v1/admin/products/:id ---
// Updates a coupon's fields. minimum_sell_price is recalculated automatically.
const updateProduct = async (req, res, next) => {
  try {
    const updated = await productService.updateCoupon(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// --- DELETE /api/v1/admin/products/:id ---
// Deletes a coupon.
const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteCoupon(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
