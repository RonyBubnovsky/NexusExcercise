// Integration tests for the Reseller API.
// Tests the full HTTP flow for product listing and purchase.
// We mock the repository layer so no real DB is needed.

const request = require('supertest');
const app = require('../app');
const productRepository = require('../repositories/productRepository');

// Mock the repository
jest.mock('../repositories/productRepository');

// Set env vars for auth
beforeAll(() => {
  process.env.RESELLER_API_KEY = 'test-reseller-key';
  process.env.JWT_SECRET = 'test-secret-key';
});

afterEach(() => {
  jest.resetAllMocks();
});

// Valid API key header helper
const authHeader = { Authorization: 'Bearer test-reseller-key' };

// Helper: a fake coupon from the DB
const fakeCoupon = (overrides = {}) => ({
  _id: 'test-uuid-123',
  name: 'Amazon $100 Coupon',
  description: 'Gift card',
  type: 'COUPON',
  image_url: 'https://example.com/amazon.png',
  cost_price: 80,
  margin_percentage: 25,
  minimum_sell_price: 100,
  is_sold: false,
  value_type: 'STRING',
  value: 'ABCD-1234',
  ...overrides,
});

// =============================================
// AUTH MIDDLEWARE
// =============================================

describe('Reseller Auth Middleware', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with an invalid API key', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', 'Bearer wrong-key');

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should pass with a valid API key', async () => {
    productRepository.findAllAvailable.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/products')
      .set(authHeader);

    expect(res.status).toBe(200);
  });
});

// =============================================
// GET /api/v1/products
// =============================================

describe('GET /api/v1/products', () => {
  it('should return available products without sensitive fields', async () => {
    productRepository.findAllAvailable.mockResolvedValue([
      fakeCoupon(),
      fakeCoupon({ _id: 'uuid-2', name: 'Netflix Coupon' }),
    ]);

    const res = await request(app)
      .get('/api/v1/products')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    // Check correct fields are present
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('description');
    expect(res.body[0]).toHaveProperty('image_url');
    expect(res.body[0]).toHaveProperty('price', 100);

    // Check sensitive fields are NOT present
    expect(res.body[0]).not.toHaveProperty('cost_price');
    expect(res.body[0]).not.toHaveProperty('margin_percentage');
    expect(res.body[0]).not.toHaveProperty('value');
    expect(res.body[0]).not.toHaveProperty('value_type');
  });

  it('should return empty array when no products available', async () => {
    productRepository.findAllAvailable.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/products')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// =============================================
// GET /api/v1/products/:id
// =============================================

describe('GET /api/v1/products/:id', () => {
  it('should return a product without sensitive fields', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const res = await request(app)
      .get('/api/v1/products/test-uuid-123')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-uuid-123');
    expect(res.body.price).toBe(100);

    // Sensitive fields must NOT be exposed
    expect(res.body).not.toHaveProperty('cost_price');
    expect(res.body).not.toHaveProperty('margin_percentage');
    expect(res.body).not.toHaveProperty('value');
  });

  it('should return 404 when product not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/products/bad-id')
      .set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });
});

// =============================================
// POST /api/v1/products/:id/purchase
// =============================================

describe('POST /api/v1/products/:id/purchase', () => {
  it('should succeed and return coupon value when reseller_price >= minimum', async () => {
    const coupon = fakeCoupon();
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .set(authHeader)
      .send({ reseller_price: 120 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      product_id: 'test-uuid-123',
      final_price: 120,
      value_type: 'STRING',
      value: 'ABCD-1234',
    });
  });

  it('should succeed with reseller_price exactly equal to minimum', async () => {
    const coupon = fakeCoupon();
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .set(authHeader)
      .send({ reseller_price: 100 });

    expect(res.status).toBe(200);
    expect(res.body.final_price).toBe(100);
    expect(res.body.value).toBe('ABCD-1234');
  });

  it('should return 400 RESELLER_PRICE_TOO_LOW when price < minimum', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .set(authHeader)
      .send({ reseller_price: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('RESELLER_PRICE_TOO_LOW');
  });

  it('should return 404 PRODUCT_NOT_FOUND when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/products/bad-id/purchase')
      .set(authHeader)
      .send({ reseller_price: 120 });

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 409 PRODUCT_ALREADY_SOLD when product is already sold', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon({ is_sold: true }));

    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .set(authHeader)
      .send({ reseller_price: 120 });

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });

  it('should return 409 on race condition (atomic check fails)', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());
    productRepository.markAsSold.mockResolvedValue(null); // Someone else bought it

    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .set(authHeader)
      .send({ reseller_price: 120 });

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/products/test-uuid-123/purchase')
      .send({ reseller_price: 120 });

    expect(res.status).toBe(401);
  });
});
