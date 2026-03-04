// Product Repository – the ONLY layer that talks to the database.
// All database queries and operations are centralized here.
// Controllers and services never call Mongoose directly.
//
// This makes it easy to:
// 1. Swap the database technology in the future
// 2. Mock database calls in service/controller tests
// 3. Keep DB logic separated from business logic

const { Coupon } = require('../models');

// --- CREATE ---
// Creates a new coupon in the database.
// minimum_sell_price is calculated automatically by the model's pre-save hook.
const create = async (couponData) => {
  const coupon = new Coupon(couponData);
  return coupon.save();
};

// --- READ ALL (unsold only) ---
// Returns all coupons that have not been sold yet.
// Used by both the frontend (customer view) and the reseller API.
const findAllAvailable = async () => {
  return Coupon.find({ is_sold: false });
};

// --- READ ALL (including sold) ---
// Returns all coupons regardless of sold status.
// NOTE: Access control is NOT enforced here – the repository is a "dumb" data layer.
// It is the responsibility of the routes/middleware layer to ensure only
// authenticated admins can reach the service that calls this function.
const findAll = async () => {
  return Coupon.find({});
};

// --- READ BY ID ---
// Returns a single coupon by its UUID, or null if not found.
const findById = async (id) => {
  return Coupon.findById(id);
};

// --- UPDATE ---
// Updates a coupon's fields by UUID.
// Returns the updated document (after the update is applied).
// The model's pre-findOneAndUpdate hook recalculates minimum_sell_price
// if pricing fields are included in the update.
const update = async (id, updateData) => {
  return Coupon.findByIdAndUpdate(id, updateData, {
    new: true,           // Return the updated document (not the old one)
    runValidators: true, // Run schema validators on the updated fields
  });
};

// --- DELETE ---
// Deletes a coupon by UUID.
// Returns the deleted document, or null if not found.
const remove = async (id) => {
  return Coupon.findByIdAndDelete(id);
};

// --- ATOMIC PURCHASE ---
// Marks a coupon as sold ATOMICALLY using findOneAndUpdate.
// The query filter ensures:
//   1. The coupon exists (_id matches)
//   2. The coupon is NOT already sold (is_sold: false)
// If both conditions are met, it sets is_sold to true in one atomic operation.
// This prevents race conditions where two buyers try to purchase simultaneously.
//
// Returns the updated document if successful, or null if the coupon
// was not found OR was already sold.
const markAsSold = async (id) => {
  return Coupon.findOneAndUpdate(
    { _id: id, is_sold: false },  // Only match if not yet sold
    { $set: { is_sold: true } },  // Atomically mark as sold
    { new: true }                 // Return the updated document
  );
};

module.exports = {
  create,
  findAllAvailable,
  findAll,
  findById,
  update,
  remove,
  markAsSold,
};
