// Barrel export for all models.
// Import this file to ensure all discriminators are registered with Mongoose.

const Product = require('./Product');
const Coupon = require('./Coupon');

module.exports = { Product, Coupon };
