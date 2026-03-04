// Tests for the health check endpoint.
// Uses Supertest to make HTTP requests directly to the Express app
// without starting the server or connecting to MongoDB.

const request = require('supertest');
const app = require('../app');

describe('GET /api/v1/health', () => {
  it('should return status ok with 200', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Error handling', () => {
  it('should return 404 with standardized error for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent');

    expect(response.status).toBe(404);
  });
});
