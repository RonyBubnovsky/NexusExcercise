// Unit tests for the Product Service.
// We MOCK the repository so these tests run without a database.
// This lets us test pure business logic in isolation.

const productService = require('../services/productService');
const productRepository = require('../repositories/productRepository');
const AppError = require('../utils/AppError');

// Mock the entire repository module – Jest replaces all functions with mock fns
jest.mock('../repositories/productRepository');

// Reset all mocks between tests so they don't leak state
afterEach(() => {
  jest.resetAllMocks();
});

// Helper: a fake coupon object (as it would come from the DB)
const fakeCoupon = (overrides = {}) => ({
  _id: 'test-uuid-123',
  name: 'Amazon $100 Coupon',
  description: 'Gift card',
  image_url: 'https://example.com/amazon.png',
  type: 'COUPON',
  cost_price: 80,
  margin_percentage: 25,
  minimum_sell_price: 100,
  is_sold: false,
  value_type: 'STRING',
  value: 'ABCD-1234',
  ...overrides,
});

// =============================================
// ADMIN OPERATIONS
// =============================================

describe('Admin - createCoupon', () => {
  it('should call repository.create and return the result', async () => {
    const data = {
      name: 'Test',
      description: 'A test coupon',
      image_url: 'https://example.com/img.png',
      cost_price: 80,
      margin_percentage: 25,
      value_type: 'STRING',
      value: 'CODE-123',
    };
    const created = fakeCoupon();
    productRepository.create.mockResolvedValue(created);

    const result = await productService.createCoupon(data);

    expect(productRepository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(created);
  });

  it('should throw VALIDATION_ERROR when required fields are missing', async () => {
    await expect(productService.createCoupon({ name: 'Incomplete' }))
      .rejects.toThrow(AppError);

    try {
      await productService.createCoupon({ name: 'Incomplete' });
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('VALIDATION_ERROR');
    }
  });

  it('should throw VALIDATION_ERROR for negative cost_price', async () => {
    const data = { ...fakeCoupon(), cost_price: -10 };
    await expect(productService.createCoupon(data))
      .rejects.toThrow(AppError);
  });
});

describe('Admin - getAllCoupons', () => {
  it('should return all coupons from repository', async () => {
    const coupons = [fakeCoupon(), fakeCoupon({ _id: 'uuid-2' })];
    productRepository.findAll.mockResolvedValue(coupons);

    const result = await productService.getAllCoupons();

    expect(result).toHaveLength(2);
  });
});

describe('Admin - getCouponById', () => {
  it('should return the coupon when found', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const result = await productService.getCouponById('test-uuid-123');

    expect(result.name).toBe('Amazon $100 Coupon');
  });

  it('should throw PRODUCT_NOT_FOUND when not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(productService.getCouponById('bad-id'))
      .rejects
      .toThrow(AppError);

    try {
      await productService.getCouponById('bad-id');
    } catch (err) {
      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe('PRODUCT_NOT_FOUND');
    }
  });
});

describe('Admin - updateCoupon', () => {
  it('should return the updated coupon', async () => {
    const updated = fakeCoupon({ name: 'Updated' });
    productRepository.update.mockResolvedValue(updated);

    const result = await productService.updateCoupon('test-uuid-123', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('should throw PRODUCT_NOT_FOUND if coupon does not exist', async () => {
    productRepository.update.mockResolvedValue(null);

    await expect(productService.updateCoupon('bad-id', { name: 'X' }))
      .rejects
      .toMatchObject({ statusCode: 404, errorCode: 'PRODUCT_NOT_FOUND' });
  });
});

describe('Admin - deleteCoupon', () => {
  it('should return the deleted coupon', async () => {
    productRepository.remove.mockResolvedValue(fakeCoupon());

    const result = await productService.deleteCoupon('test-uuid-123');

    expect(result._id).toBe('test-uuid-123');
  });

  it('should throw PRODUCT_NOT_FOUND if coupon does not exist', async () => {
    productRepository.remove.mockResolvedValue(null);

    await expect(productService.deleteCoupon('bad-id'))
      .rejects
      .toMatchObject({ statusCode: 404, errorCode: 'PRODUCT_NOT_FOUND' });
  });
});

// =============================================
// PUBLIC OPERATIONS
// =============================================

describe('getAvailableProducts', () => {
  it('should return only unsold products', async () => {
    const available = [fakeCoupon()];
    productRepository.findAllAvailable.mockResolvedValue(available);

    const result = await productService.getAvailableProducts();

    expect(result).toHaveLength(1);
    expect(productRepository.findAllAvailable).toHaveBeenCalled();
  });
});

describe('getProductById', () => {
  it('should return the product when found', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const result = await productService.getProductById('test-uuid-123');
    expect(result.name).toBe('Amazon $100 Coupon');
  });

  it('should throw PRODUCT_NOT_FOUND when not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(productService.getProductById('bad-id'))
      .rejects
      .toMatchObject({ statusCode: 404, errorCode: 'PRODUCT_NOT_FOUND' });
  });
});

// =============================================
// PURCHASE – the core business logic
// =============================================

describe('purchaseProduct', () => {
  // --- Successful purchases ---

  it('should succeed for direct customer (no reseller_price)', async () => {
    const coupon = fakeCoupon();
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const result = await productService.purchaseProduct('test-uuid-123');

    expect(result).toEqual({
      product_id: 'test-uuid-123',
      final_price: 100, // minimum_sell_price
      value_type: 'STRING',
      value: 'ABCD-1234',
    });
    expect(productRepository.markAsSold).toHaveBeenCalledWith('test-uuid-123');
  });

  it('should succeed for reseller with price >= minimum_sell_price', async () => {
    const coupon = fakeCoupon(); // minimum_sell_price = 100
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const result = await productService.purchaseProduct('test-uuid-123', 120);

    expect(result.final_price).toBe(120);
    expect(result.value).toBe('ABCD-1234');
  });

  it('should succeed for reseller with price exactly equal to minimum_sell_price', async () => {
    const coupon = fakeCoupon(); // minimum_sell_price = 100
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const result = await productService.purchaseProduct('test-uuid-123', 100);

    expect(result.final_price).toBe(100);
  });

  // --- Error cases ---

  it('should throw PRODUCT_NOT_FOUND if product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(productService.purchaseProduct('bad-id'))
      .rejects
      .toMatchObject({ statusCode: 404, errorCode: 'PRODUCT_NOT_FOUND' });
  });

  it('should throw PRODUCT_ALREADY_SOLD if product is already sold (early check)', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon({ is_sold: true }));

    await expect(productService.purchaseProduct('test-uuid-123'))
      .rejects
      .toMatchObject({ statusCode: 409, errorCode: 'PRODUCT_ALREADY_SOLD' });

    // markAsSold should NOT be called since we caught it early
    expect(productRepository.markAsSold).not.toHaveBeenCalled();
  });

  it('should throw RESELLER_PRICE_TOO_LOW if reseller_price < minimum_sell_price', async () => {
    const coupon = fakeCoupon(); // minimum_sell_price = 100
    productRepository.findById.mockResolvedValue(coupon);

    await expect(productService.purchaseProduct('test-uuid-123', 50))
      .rejects
      .toMatchObject({ statusCode: 400, errorCode: 'RESELLER_PRICE_TOO_LOW' });

    // markAsSold should NOT be called since price validation failed
    expect(productRepository.markAsSold).not.toHaveBeenCalled();
  });

  it('should throw PRODUCT_ALREADY_SOLD on race condition (atomic check)', async () => {
    // Product looks available during findById...
    productRepository.findById.mockResolvedValue(fakeCoupon());
    // ...but someone else purchased it before our markAsSold
    productRepository.markAsSold.mockResolvedValue(null);

    await expect(productService.purchaseProduct('test-uuid-123'))
      .rejects
      .toMatchObject({ statusCode: 409, errorCode: 'PRODUCT_ALREADY_SOLD' });
  });
});
