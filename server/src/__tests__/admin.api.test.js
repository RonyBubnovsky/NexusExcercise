// Integration tests for the Admin API.
// Tests the full HTTP flow: request → route → middleware → controller → service.
// We mock the repository layer so no real DB is needed.
// We set env vars for JWT and admin credentials before tests run.

const request = require('supertest');
const app = require('../app');
const productRepository = require('../repositories/productRepository');

// Mock the repository – we already tested it separately
jest.mock('../repositories/productRepository');

// Set env vars for auth (before authService reads them)
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'password123';
});

afterEach(() => {
  jest.resetAllMocks();
});

// Helper: a fake coupon as it comes from the DB
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper: get a valid admin JWT token
const getAdminToken = async () => {
  const res = await request(app)
    .post('/api/v1/admin/login')
    .send({ username: 'admin', password: 'password123' });

  return res.body.token;
};

// =============================================
// LOGIN
// =============================================

describe('POST /api/v1/admin/login', () => {
  it('should return a JWT token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should return 401 with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 400 when username or password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

// =============================================
// AUTH MIDDLEWARE
// =============================================

describe('Admin Auth Middleware', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/admin/products');

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('should pass with a valid admin token', async () => {
    const token = await getAdminToken();
    productRepository.findAll.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// =============================================
// CRUD ENDPOINTS
// =============================================

describe('POST /api/v1/admin/products', () => {
  it('should create a coupon and return 201', async () => {
    const token = await getAdminToken();
    const created = fakeCoupon();
    productRepository.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Amazon $100 Coupon',
        description: 'Gift card',
        image_url: 'https://example.com/amazon.png',
        cost_price: 80,
        margin_percentage: 25,
        value_type: 'STRING',
        value: 'ABCD-1234',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Amazon $100 Coupon');
    expect(res.body.minimum_sell_price).toBe(100);
  });
});

describe('GET /api/v1/admin/products', () => {
  it('should return all coupons including sold ones', async () => {
    const token = await getAdminToken();
    const coupons = [fakeCoupon(), fakeCoupon({ _id: 'uuid-2', is_sold: true })];
    productRepository.findAll.mockResolvedValue(coupons);

    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/v1/admin/products/:id', () => {
  it('should return a single coupon with full details', async () => {
    const token = await getAdminToken();
    productRepository.findById.mockResolvedValue(fakeCoupon());

    const res = await request(app)
      .get('/api/v1/admin/products/test-uuid-123')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cost_price).toBe(80); // Admin sees internal pricing
    expect(res.body.value).toBe('ABCD-1234'); // Admin sees coupon value
  });

  it('should return 404 when coupon not found', async () => {
    const token = await getAdminToken();
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/admin/products/bad-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });
});

describe('PUT /api/v1/admin/products/:id', () => {
  it('should update and return the updated coupon', async () => {
    const token = await getAdminToken();
    const existing = fakeCoupon({ is_sold: false });
    const updated = fakeCoupon({ name: 'Updated Name', cost_price: 100, margin_percentage: 50, minimum_sell_price: 150 });
    productRepository.findById.mockResolvedValue(existing);
    productRepository.update.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/v1/admin/products/test-uuid-123')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', cost_price: 100, margin_percentage: 50 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.minimum_sell_price).toBe(150);
  });

  it('should return 404 when coupon not found', async () => {
    const token = await getAdminToken();
    productRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/admin/products/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });
});

describe('DELETE /api/v1/admin/products/:id', () => {
  it('should delete and return 204', async () => {
    const token = await getAdminToken();
    productRepository.remove.mockResolvedValue(fakeCoupon());

    const res = await request(app)
      .delete('/api/v1/admin/products/test-uuid-123')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('should return 404 when coupon not found', async () => {
    const token = await getAdminToken();
    productRepository.remove.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/v1/admin/products/bad-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });
});
