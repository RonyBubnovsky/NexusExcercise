// Product base model.
// This is the parent schema for all product types (currently: COUPON).
// We use Mongoose discriminators so that each product type (Coupon, etc.)
// can add its own fields while sharing the common Product fields.
//
// The "type" field acts as the discriminator key – Mongoose uses it
// to determine which sub-model a document belongs to.

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// --- Base Product Schema ---
const productSchema = new mongoose.Schema(
  {
    // Use UUID as the public-facing ID (instead of MongoDB's ObjectId)
    _id: {
      type: String,
      default: uuidv4,
    },

    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },

    // Discriminator key – determines the product type (e.g., "COUPON")
    type: {
      type: String,
      required: true,
      enum: ['COUPON'],
    },

    image_url: {
      type: String,
      required: [true, 'Product image URL is required'],
      trim: true,
    },
  },
  {
    // Adds createdAt and updatedAt fields automatically
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },

    // Use the "type" field as the discriminator key
    discriminatorKey: 'type',
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
