// Product Controller – handles HTTP requests for the reseller/customer API.
// Each function is "thin": extract request data, call service, format response.
//
// IMPORTANT: The response format strips sensitive fields (cost_price,
// margin_percentage, value). The coupon value is ONLY returned after purchase.

const productService = require('../services/productService');

// --- Helper: format a product for the public API ---
// Strips internal pricing fields and coupon value.
// Returns only: id, name, description, image_url, price (= minimum_sell_price)
const formatProductForPublic = (product) => ({
  id: product._id,
  name: product.name,
  description: product.description,
  image_url: product.image_url,
  price: product.minimum_sell_price,
});

// --- GET /api/v1/products ---
// Returns all available (unsold) products, without sensitive fields.
const getAvailableProducts = async (req, res, next) => {
  try {
    const products = await productService.getAvailableProducts();
    res.json(products.map(formatProductForPublic));
  } catch (error) {
    next(error);
  }
};

// --- GET /api/v1/products/:id ---
// Returns a single product by ID, without sensitive fields.
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(formatProductForPublic(product));
  } catch (error) {
    next(error);
  }
};

// --- POST /api/v1/products/:id/purchase ---
// Purchases a product. Requires reseller_price in the request body.
// On success, returns the coupon value.
const purchaseProduct = async (req, res, next) => {
  try {
    const { reseller_price } = req.body;

    // Reseller must provide a price
    if (reseller_price === undefined || reseller_price === null) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'reseller_price is required',
      });
    }

    if (typeof reseller_price !== 'number' || reseller_price < 0) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'reseller_price must be a non-negative number',
      });
    }

    const result = await productService.purchaseProduct(req.params.id, reseller_price);
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
