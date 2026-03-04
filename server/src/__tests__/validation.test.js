// Tests for input validation across the API.
// Covers admin create/update validation, reseller purchase validation,
// and store edge cases.

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Coupon = require('../models/Coupon');
const authService = require('../services/authService');

let mongo;
let adminToken;

// Reusable valid coupon data
const validCoupon = () => ({
  name: 'Test Coupon',
  description: 'A test coupon',
  image_url: 'https://example.com/img.png',
  cost_price: 80,
  margin_percentage: 25,
  value_type: 'STRING',
  value: 'TEST-CODE-123',
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  // Set admin credentials for this test suite
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'password123';
  process.env.JWT_SECRET = 'test-secret';
  process.env.RESELLER_API_KEY = 'test-reseller-key';

  const loginRes = await request(app)
    .post('/api/v1/admin/login')
    .send({ username: 'admin', password: 'password123' });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

afterEach(async () => {
  await Coupon.deleteMany({});
});

// =============================================
// ADMIN CREATE VALIDATION
// =============================================

describe('POST /api/v1/admin/products – validation', () => {
  it('should reject when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/Missing required fields/);
  });

  it('should reject negative cost_price', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCoupon(), cost_price: -10 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/cost_price/);
  });

  it('should reject negative margin_percentage', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCoupon(), margin_percentage: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/margin_percentage/);
  });

  it('should reject non-numeric cost_price', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCoupon(), cost_price: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid value_type', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCoupon(), value_type: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/value_type/);
  });

  it('should accept valid coupon data', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCoupon());

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Coupon');
    expect(res.body.minimum_sell_price).toBe(100);
  });

  it('should accept cost_price of 0', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCoupon(), cost_price: 0 });

    expect(res.status).toBe(201);
    expect(res.body.minimum_sell_price).toBe(0);
  });
});

// =============================================
// ADMIN UPDATE VALIDATION
// =============================================

describe('PUT /api/v1/admin/products/:id – validation', () => {
  let couponId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCoupon());
    couponId = res.body._id;
  });

  it('should reject negative cost_price on update', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/products/${couponId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost_price: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid value_type on update', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/products/${couponId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ value_type: 'PDF' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('should accept valid update', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/products/${couponId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });
});

// =============================================
// RESELLER PURCHASE VALIDATION
// =============================================

describe('POST /api/v1/products/:id/purchase – reseller validation', () => {
  let couponId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCoupon());
    couponId = res.body._id;
  });

  it('should reject purchase without reseller_price', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${couponId}/purchase`)
      .set('Authorization', `Bearer test-reseller-key`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/reseller_price is required/);
  });

  it('should reject non-numeric reseller_price', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${couponId}/purchase`)
      .set('Authorization', `Bearer test-reseller-key`)
      .send({ reseller_price: 'free' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/non-negative number/);
  });

  it('should reject negative reseller_price', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${couponId}/purchase`)
      .set('Authorization', `Bearer test-reseller-key`)
      .send({ reseller_price: -50 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('should reject reseller_price below minimum_sell_price', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${couponId}/purchase`)
      .set('Authorization', `Bearer test-reseller-key`)
      .send({ reseller_price: 50 }); // min is 100

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('RESELLER_PRICE_TOO_LOW');
  });

  it('should accept reseller_price equal to minimum_sell_price', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${couponId}/purchase`)
      .set('Authorization', `Bearer test-reseller-key`)
      .send({ reseller_price: 100 });

    expect(res.status).toBe(200);
    expect(res.body.value).toBe('TEST-CODE-123');
    expect(res.body.final_price).toBe(100);
  });
});

// =============================================
// AUTH VALIDATION
// =============================================

describe('Auth validation', () => {
  it('should reject admin login without credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('should reject admin routes without token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products');

    expect(res.status).toBe(401);
  });

  it('should reject reseller routes without API key', async () => {
    const res = await request(app)
      .get('/api/v1/products');

    expect(res.status).toBe(401);
  });

  it('should reject admin routes with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
