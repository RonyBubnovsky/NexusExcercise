// Integration tests for the Store API (direct customer endpoints).
// These are PUBLIC endpoints – no authentication required.
// We mock the repository layer so no real DB is needed.

const request = require('supertest');
const app = require('../app');
const productRepository = require('../repositories/productRepository');

jest.mock('../repositories/productRepository');

afterEach(() => {
  jest.resetAllMocks();
});

// Helper: fake coupon from the DB
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
// GET /api/v1/store/products (no auth needed)
// =============================================

describe('GET /api/v1/store/products', () => {
  it('should return available products without auth', async () => {
    productRepository.findAllAvailable.mockResolvedValue([fakeCoupon()]);

    const res = await request(app).get('/api/v1/store/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].price).toBe(100);
  });

  it('should NOT include sensitive fields', async () => {
    productRepository.findAllAvailable.mockResolvedValue([fakeCoupon()]);

    const res = await request(app).get('/api/v1/store/products');

    expect(res.body[0]).not.toHaveProperty('cost_price');
    expect(res.body[0]).not.toHaveProperty('margin_percentage');
    expect(res.body[0]).not.toHaveProperty('value');
    expect(res.body[0]).not.toHaveProperty('value_type');
  });
});

// =============================================
// GET /api/v1/store/products/:id (no auth needed)
// =============================================

describe('GET /api/v1/store/products/:id', () => {
  it('should return a product without sensitive fields', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const res = await request(app).get('/api/v1/store/products/test-uuid-123');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-uuid-123');
    expect(res.body.price).toBe(100);
    expect(res.body).not.toHaveProperty('cost_price');
  });

  it('should return 404 when not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/store/products/bad-id');

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });
});

// =============================================
// POST /api/v1/store/products/:id/purchase (no auth, no reseller_price)
// =============================================

describe('POST /api/v1/store/products/:id/purchase', () => {
  it('should purchase at minimum_sell_price (customer cannot override)', async () => {
    const coupon = fakeCoupon();
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    const res = await request(app)
      .post('/api/v1/store/products/test-uuid-123/purchase')
      .send({}); // No reseller_price – direct customer

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      product_id: 'test-uuid-123',
      final_price: 100, // Always minimum_sell_price
      value_type: 'STRING',
      value: 'ABCD-1234',
    });
  });

  it('should return 404 when product not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/store/products/bad-id/purchase')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 409 when product is already sold', async () => {
    productRepository.findById.mockResolvedValue(fakeCoupon({ is_sold: true }));

    const res = await request(app)
      .post('/api/v1/store/products/test-uuid-123/purchase')
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });

  it('should NOT require authentication', async () => {
    const coupon = fakeCoupon();
    productRepository.findById.mockResolvedValue(coupon);
    productRepository.markAsSold.mockResolvedValue({ ...coupon, is_sold: true });

    // No Authorization header at all
    const res = await request(app)
      .post('/api/v1/store/products/test-uuid-123/purchase')
      .send({});

    expect(res.status).toBe(200);
  });
});
