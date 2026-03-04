// API client – centralized HTTP calls to the backend.
// Uses axios with the base URL from environment variables.
// All API functions are grouped by domain (store, admin).

import axios from 'axios';

// Base URL comes from the VITE_API_URL env var (set in .env or Docker)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// =============================================
// STORE API (public – no auth)
// =============================================

// Get all available (unsold) coupons for customers
export const getAvailableProducts = async () => {
  const response = await api.get('/store/products');
  return response.data;
};

// Get a single product by ID
export const getProductById = async (id) => {
  const response = await api.get(`/store/products/${id}`);
  return response.data;
};

// Purchase a coupon (direct customer – no reseller_price)
export const purchaseProduct = async (id) => {
  const response = await api.post(`/store/products/${id}/purchase`);
  return response.data;
};

// =============================================
// ADMIN API (requires JWT token)
// =============================================

// Admin login – returns a JWT token
export const adminLogin = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  return response.data;
};

// Get all coupons (including sold) – admin view
export const adminGetAllProducts = async (token) => {
  const response = await api.get('/admin/products', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Create a new coupon – admin only
export const adminCreateProduct = async (token, productData) => {
  const response = await api.post('/admin/products', productData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export default api;
