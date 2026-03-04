// Product Service – contains ALL business logic.
// The service sits between controllers and the repository.
// It validates business rules and throws AppError when rules are violated.
// Controllers just call service methods and forward the result/error.

const productRepository = require('../repositories/productRepository');
const AppError = require('../utils/AppError');

// =============================================
// ADMIN OPERATIONS
// =============================================

// --- Create a new coupon (Admin) ---
// Admin provides: name, description, image_url, cost_price, margin_percentage, value_type, value
// minimum_sell_price is calculated automatically by the model (pre-save hook).
// Pricing fields (cost_price, margin_percentage) are accepted ONLY through the admin API.
const createCoupon = async (data) => {
  return productRepository.create(data);
};

// --- Get all coupons (Admin) ---
// Returns all coupons including sold ones, with full internal details.
const getAllCoupons = async () => {
  return productRepository.findAll();
};

// --- Get a single coupon by ID (Admin) ---
// Returns full coupon details. Throws PRODUCT_NOT_FOUND if missing.
const getCouponById = async (id) => {
  const coupon = await productRepository.findById(id);

  if (!coupon) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return coupon;
};

// --- Update a coupon (Admin) ---
// Admin can update any fields. Throws PRODUCT_NOT_FOUND if the coupon doesn't exist.
const updateCoupon = async (id, updateData) => {
  const updated = await productRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return updated;
};

// --- Delete a coupon (Admin) ---
// Throws PRODUCT_NOT_FOUND if the coupon doesn't exist.
const deleteCoupon = async (id) => {
  const deleted = await productRepository.remove(id);

  if (!deleted) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return deleted;
};

// =============================================
// CUSTOMER / RESELLER OPERATIONS
// =============================================

// --- Get available products (public) ---
// Returns only unsold coupons. Sensitive fields (cost_price, margin_percentage,
// value) are stripped – the controller/route layer handles formatting the response.
const getAvailableProducts = async () => {
  return productRepository.findAllAvailable();
};

// --- Get a single available product by ID (public) ---
// Returns the product if it exists. Throws PRODUCT_NOT_FOUND if missing.
const getProductById = async (id) => {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return product;
};

// --- Purchase a product (Customer / Reseller) ---
// This is the core business operation. Steps:
//   1. Find the product (throw PRODUCT_NOT_FOUND if missing)
//   2. Check if already sold (throw PRODUCT_ALREADY_SOLD if true)
//   3. For resellers: validate reseller_price >= minimum_sell_price
//   4. Atomically mark as sold (double-check with DB-level atomicity)
//   5. Return the coupon value to the buyer
//
// Parameters:
//   - productId: the UUID of the product to purchase
//   - resellerPrice: (optional) the price the reseller wants to charge.
//     If provided, must be >= minimum_sell_price.
//     If null/undefined, it's a direct customer purchase at minimum_sell_price.
const purchaseProduct = async (productId, resellerPrice = null) => {
  // Step 1: Find the product
  const product = await productRepository.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Step 2: Check if already sold (early check – the atomic markAsSold also checks)
  if (product.is_sold) {
    throw new AppError('Product has already been sold', 409, 'PRODUCT_ALREADY_SOLD');
  }

  // Step 3: Determine the final price and validate
  let finalPrice;

  if (resellerPrice !== null && resellerPrice !== undefined) {
    // Reseller purchase – validate price meets minimum
    if (resellerPrice < product.minimum_sell_price) {
      throw new AppError(
        `Reseller price must be at least ${product.minimum_sell_price}`,
        400,
        'RESELLER_PRICE_TOO_LOW'
      );
    }
    finalPrice = resellerPrice;
  } else {
    // Direct customer purchase – price is always minimum_sell_price
    finalPrice = product.minimum_sell_price;
  }

  // Step 4: Atomically mark as sold
  // This is the critical section – even if two requests pass the checks above
  // at the same time, only ONE will succeed here because markAsSold uses
  // findOneAndUpdate with { is_sold: false } as a filter.
  const soldProduct = await productRepository.markAsSold(productId);

  if (!soldProduct) {
    // Another request purchased it between our check and the atomic update
    throw new AppError('Product has already been sold', 409, 'PRODUCT_ALREADY_SOLD');
  }

  // Step 5: Return purchase result with coupon value
  return {
    product_id: soldProduct._id,
    final_price: finalPrice,
    value_type: soldProduct.value_type,
    value: soldProduct.value,
  };
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getAvailableProducts,
  getProductById,
  purchaseProduct,
};
