// Coupon model – extends Product via Mongoose discriminator.
// A Coupon represents a digital redeemable asset (barcode / QR / hash).
//
// Key business rules enforced here:
// 1. cost_price and margin_percentage must be >= 0
// 2. minimum_sell_price is ALWAYS calculated server-side (never from client input)
//    Formula: minimum_sell_price = cost_price * (1 + margin_percentage / 100)
// 3. Coupon value (the redeemable code/image) is only returned after purchase
// 4. is_sold defaults to false and is set to true atomically upon purchase

const mongoose = require('mongoose');
const Product = require('./Product');

// --- Coupon-specific fields ---
const couponSchema = new mongoose.Schema({
  // --- Pricing fields (set by Admin only, never by external clients) ---

  cost_price: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price must be >= 0'],
  },

  margin_percentage: {
    type: Number,
    required: [true, 'Margin percentage is required'],
    min: [0, 'Margin percentage must be >= 0'],
  },

  // Derived field – calculated automatically before every save
  // Formula: cost_price * (1 + margin_percentage / 100)
  minimum_sell_price: {
    type: Number,
  },

  // Tracks whether this coupon has been purchased
  is_sold: {
    type: Boolean,
    default: false,
  },

  // --- Coupon redeemable value ---

  // The format of the coupon value (e.g., a text code or an image)
  value_type: {
    type: String,
    required: [true, 'Value type is required'],
    enum: ['STRING', 'IMAGE'],
  },

  // The actual redeemable value (barcode string, QR data, etc.)
  // This is ONLY returned to the buyer after a successful purchase
  value: {
    type: String,
    required: [true, 'Coupon value is required'],
  },
});

// --- Pre-save hook: calculate minimum_sell_price ---
// Runs before every save/create. Ensures the price is always
// computed server-side and cannot be manipulated by clients.
couponSchema.pre('save', function (next) {
  this.minimum_sell_price = this.cost_price * (1 + this.margin_percentage / 100);
  next();
});

// Also recalculate on findOneAndUpdate (used by the admin update endpoint)
couponSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Only recalculate if pricing fields are being changed
  const costPrice = update.cost_price ?? update.$set?.cost_price;
  const marginPercentage = update.margin_percentage ?? update.$set?.margin_percentage;

  if (costPrice !== undefined && marginPercentage !== undefined) {
    this.set({ minimum_sell_price: costPrice * (1 + marginPercentage / 100) });
  }

  next();
});

// Create the Coupon model as a discriminator of Product.
// This means Coupon documents are stored in the "products" collection
// with type: "COUPON", and they have all Product fields + Coupon fields.
const Coupon = Product.discriminator('COUPON', couponSchema);

module.exports = Coupon;
