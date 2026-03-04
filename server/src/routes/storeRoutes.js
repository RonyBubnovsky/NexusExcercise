// Store Routes – public endpoints for direct customers (frontend).
// NO authentication required – anyone can browse and purchase.
// This is separate from the reseller API which requires a Bearer token.

const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// GET /api/v1/store/products – list all available (unsold) products
router.get('/products', storeController.getAvailableProducts);

// GET /api/v1/store/products/:id – get a single product by ID
router.get('/products/:id', storeController.getProductById);

// POST /api/v1/store/products/:id/purchase – purchase a product (direct customer)
router.post('/products/:id/purchase', storeController.purchaseProduct);

module.exports = router;
