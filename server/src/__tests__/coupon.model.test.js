// Tests for the Coupon model.
// Uses an in-memory MongoDB (mongodb-memory-server) so tests run
// without needing a real database connection.
//
// We test:
// 1. Required fields validation
// 2. Server-side calculation of minimum_sell_price
// 3. Constraints (cost_price >= 0, margin_percentage >= 0)
// 4. Default values (is_sold = false)

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Coupon } = require('../models');

let mongoServer;

// Start in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Clean up the collection between tests
afterEach(async () => {
  await Coupon.deleteMany({});
});

// Disconnect and stop in-memory MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper: returns a valid coupon object for testing
const validCouponData = () => ({
  name: 'Amazon $100 Coupon',
  description: 'Gift card for Amazon',
  image_url: 'https://example.com/amazon.png',
  cost_price: 80,
  margin_percentage: 25,
  value_type: 'STRING',
  value: 'ABCD-1234',
});

describe('Coupon Model', () => {
  // --- minimum_sell_price calculation ---

  it('should calculate minimum_sell_price on save', async () => {
    // cost_price=80, margin=25% → minimum_sell_price = 80 * 1.25 = 100
    const coupon = await Coupon.create(validCouponData());

    expect(coupon.minimum_sell_price).toBe(100);
  });

  it('should recalculate minimum_sell_price when pricing fields change', async () => {
    const coupon = await Coupon.create(validCouponData());
    expect(coupon.minimum_sell_price).toBe(100);

    // Update pricing: cost=100, margin=50% → minimum_sell_price = 100 * 1.5 = 150
    coupon.cost_price = 100;
    coupon.margin_percentage = 50;
    await coupon.save();

    expect(coupon.minimum_sell_price).toBe(150);
  });

  it('should handle zero cost_price (free product)', async () => {
    const data = { ...validCouponData(), cost_price: 0, margin_percentage: 50 };
    const coupon = await Coupon.create(data);

    // 0 * 1.5 = 0
    expect(coupon.minimum_sell_price).toBe(0);
  });

  it('should handle zero margin_percentage', async () => {
    const data = { ...validCouponData(), cost_price: 80, margin_percentage: 0 };
    const coupon = await Coupon.create(data);

    // 80 * 1.0 = 80
    expect(coupon.minimum_sell_price).toBe(80);
  });

  // --- Default values ---

  it('should default is_sold to false', async () => {
    const coupon = await Coupon.create(validCouponData());

    expect(coupon.is_sold).toBe(false);
  });

  it('should set type to COUPON automatically', async () => {
    const coupon = await Coupon.create(validCouponData());

    expect(coupon.type).toBe('COUPON');
  });

  it('should generate a UUID as _id', async () => {
    const coupon = await Coupon.create(validCouponData());

    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(coupon._id).toMatch(uuidRegex);
  });

  // --- Required field validations ---

  it('should fail when name is missing', async () => {
    const data = { ...validCouponData(), name: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/name.*required/i);
  });

  it('should fail when description is missing', async () => {
    const data = { ...validCouponData(), description: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/description.*required/i);
  });

  it('should fail when image_url is missing', async () => {
    const data = { ...validCouponData(), image_url: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/image_url.*required/i);
  });

  it('should fail when cost_price is missing', async () => {
    const data = { ...validCouponData(), cost_price: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/cost_price.*required/i);
  });

  it('should fail when margin_percentage is missing', async () => {
    const data = { ...validCouponData(), margin_percentage: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/margin_percentage.*required/i);
  });

  it('should fail when value_type is missing', async () => {
    const data = { ...validCouponData(), value_type: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/value_type.*required/i);
  });

  it('should fail when value is missing', async () => {
    const data = { ...validCouponData(), value: undefined };

    await expect(Coupon.create(data)).rejects.toThrow(/value.*required/i);
  });

  // --- Constraint validations ---

  it('should fail when cost_price is negative', async () => {
    const data = { ...validCouponData(), cost_price: -10 };

    await expect(Coupon.create(data)).rejects.toThrow(/cost_price/i);
  });

  it('should fail when margin_percentage is negative', async () => {
    const data = { ...validCouponData(), margin_percentage: -5 };

    await expect(Coupon.create(data)).rejects.toThrow(/margin_percentage/i);
  });

  it('should fail when value_type is not STRING or IMAGE', async () => {
    const data = { ...validCouponData(), value_type: 'INVALID' };

    await expect(Coupon.create(data)).rejects.toThrow(/value_type/i);
  });
});
