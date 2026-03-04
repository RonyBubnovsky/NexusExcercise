// Tests for the Product Repository.
// Uses an in-memory MongoDB to test actual DB operations.
//
// We test every repository function:
// - create, findAllAvailable, findAll, findById, update, remove, markAsSold

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productRepository = require('../repositories/productRepository');
const { Coupon } = require('../models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Coupon.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper: valid coupon data
const validCoupon = (overrides = {}) => ({
  name: 'Amazon $100 Coupon',
  description: 'Gift card for Amazon',
  image_url: 'https://example.com/amazon.png',
  cost_price: 80,
  margin_percentage: 25,
  value_type: 'STRING',
  value: 'ABCD-1234',
  ...overrides,
});

describe('productRepository', () => {
  // --- create ---
  describe('create', () => {
    it('should create a coupon and calculate minimum_sell_price', async () => {
      const coupon = await productRepository.create(validCoupon());

      expect(coupon.name).toBe('Amazon $100 Coupon');
      expect(coupon.minimum_sell_price).toBe(100); // 80 * 1.25
      expect(coupon.is_sold).toBe(false);
      expect(coupon._id).toBeDefined();
    });
  });

  // --- findAllAvailable ---
  describe('findAllAvailable', () => {
    it('should return only unsold coupons', async () => {
      await productRepository.create(validCoupon({ name: 'Available' }));
      await productRepository.create(validCoupon({ name: 'Sold' }));

      // Mark the second one as sold
      const allCoupons = await Coupon.find({});
      await Coupon.findByIdAndUpdate(allCoupons[1]._id, { is_sold: true });

      const available = await productRepository.findAllAvailable();

      expect(available).toHaveLength(1);
      expect(available[0].name).toBe('Available');
    });

    it('should return empty array when all are sold', async () => {
      const coupon = await productRepository.create(validCoupon());
      await Coupon.findByIdAndUpdate(coupon._id, { is_sold: true });

      const available = await productRepository.findAllAvailable();
      expect(available).toHaveLength(0);
    });
  });

  // --- findAll ---
  describe('findAll', () => {
    it('should return all coupons including sold ones', async () => {
      await productRepository.create(validCoupon({ name: 'A' }));
      const soldCoupon = await productRepository.create(validCoupon({ name: 'B' }));
      await Coupon.findByIdAndUpdate(soldCoupon._id, { is_sold: true });

      const all = await productRepository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  // --- findById ---
  describe('findById', () => {
    it('should return the coupon when found', async () => {
      const created = await productRepository.create(validCoupon());
      const found = await productRepository.findById(created._id);

      expect(found).not.toBeNull();
      expect(found.name).toBe('Amazon $100 Coupon');
    });

    it('should return null when not found', async () => {
      const found = await productRepository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  // --- update ---
  describe('update', () => {
    it('should update fields and return the updated document', async () => {
      const created = await productRepository.create(validCoupon());

      const updated = await productRepository.update(created._id, {
        name: 'Updated Name',
        cost_price: 100,
        margin_percentage: 50,
      });

      expect(updated.name).toBe('Updated Name');
      // minimum_sell_price recalculated: 100 * 1.5 = 150
      expect(updated.minimum_sell_price).toBe(150);
    });

    it('should return null when updating a non-existent coupon', async () => {
      const result = await productRepository.update('non-existent-id', { name: 'X' });
      expect(result).toBeNull();
    });
  });

  // --- remove ---
  describe('remove', () => {
    it('should delete and return the deleted coupon', async () => {
      const created = await productRepository.create(validCoupon());
      const deleted = await productRepository.remove(created._id);

      expect(deleted).not.toBeNull();
      expect(deleted._id).toBe(created._id);

      // Verify it's gone
      const found = await productRepository.findById(created._id);
      expect(found).toBeNull();
    });

    it('should return null when deleting a non-existent coupon', async () => {
      const result = await productRepository.remove('non-existent-id');
      expect(result).toBeNull();
    });
  });

  // --- markAsSold (atomic purchase) ---
  describe('markAsSold', () => {
    it('should atomically mark an unsold coupon as sold', async () => {
      const created = await productRepository.create(validCoupon());
      const sold = await productRepository.markAsSold(created._id);

      expect(sold).not.toBeNull();
      expect(sold.is_sold).toBe(true);
    });

    it('should return null if the coupon is already sold (prevents double purchase)', async () => {
      const created = await productRepository.create(validCoupon());

      // First purchase succeeds
      await productRepository.markAsSold(created._id);

      // Second purchase attempt should fail (already sold)
      const secondAttempt = await productRepository.markAsSold(created._id);
      expect(secondAttempt).toBeNull();
    });

    it('should return null if the coupon does not exist', async () => {
      const result = await productRepository.markAsSold('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
