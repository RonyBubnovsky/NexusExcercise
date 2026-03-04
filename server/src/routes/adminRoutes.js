// Admin Routes – maps HTTP endpoints to admin controller functions.
// The login endpoint is PUBLIC (no auth required).
// All other endpoints are PROTECTED by the adminAuth middleware.

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public – admin login (returns JWT)
router.post('/login', adminController.login);

// Protected – all CRUD operations require a valid admin JWT
router.post('/products', adminAuth, adminController.createProduct);
router.get('/products', adminAuth, adminController.getAllProducts);
router.get('/products/:id', adminAuth, adminController.getProductById);
router.put('/products/:id', adminAuth, adminController.updateProduct);
router.delete('/products/:id', adminAuth, adminController.deleteProduct);

module.exports = router;
