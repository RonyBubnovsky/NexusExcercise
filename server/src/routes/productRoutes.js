// Product Routes – maps HTTP endpoints to product controller functions.
// All endpoints are protected by the resellerAuth middleware (Bearer API key).

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const resellerAuth = require('../middleware/resellerAuth');

// All reseller endpoints require a valid API key
router.use(resellerAuth);

// GET /api/v1/products – list all available (unsold) products
router.get('/', productController.getAvailableProducts);

// GET /api/v1/products/:id – get a single product by ID
router.get('/:id', productController.getProductById);

// POST /api/v1/products/:id/purchase – purchase a product
router.post('/:id/purchase', productController.purchaseProduct);

module.exports = router;
