// Store Controller – handles HTTP requests for direct customers (frontend).
// These endpoints are PUBLIC (no authentication required).
// Customers see products at minimum_sell_price and cannot override the price.
//
// The response format is identical to the reseller API (same public fields),
// but purchase does NOT require reseller_price – price is always minimum_sell_price.

const productService = require('../services/productService');

// --- Helper: format a product for public display ---
// Same as reseller API – strips sensitive fields (cost_price, margin, value).
const formatProductForPublic = (product) => ({
  id: product._id,
  name: product.name,
  description: product.description,
  image_url: product.image_url,
  price: product.minimum_sell_price,
});

// --- GET /api/v1/store/products ---
// Returns all available (unsold) products for customers to browse.
const getAvailableProducts = async (req, res, next) => {
  try {
    const products = await productService.getAvailableProducts();
    res.json(products.map(formatProductForPublic));
  } catch (error) {
    next(error);
  }
};

// --- GET /api/v1/store/products/:id ---
// Returns a single product by ID.
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(formatProductForPublic(product));
  } catch (error) {
    next(error);
  }
};

// --- POST /api/v1/store/products/:id/purchase ---
// Direct customer purchase. No reseller_price needed.
// Price is always minimum_sell_price (customers cannot override it).
// On success, returns the coupon value.
const purchaseProduct = async (req, res, next) => {
  try {
    // Pass null as resellerPrice → service uses minimum_sell_price
    const result = await productService.purchaseProduct(req.params.id, null);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableProducts,
  getProductById,
  purchaseProduct,
};
