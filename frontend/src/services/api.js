import axios from 'axios';

const API = axios.create({
  baseURL: '',
  timeout: 30000,
});

// Axios interceptor to add JWT token if exists
API.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// ─── Auth ───────────────────────────────────────────────────────────────────
export const login = (data) => API.post('/api/auth/login', data);
export const register = (data) => API.post('/api/auth/register', data);

// ─── Products ───────────────────────────────────────────────────────────────
export const getProducts = (category = '') =>
  API.get('/api/products', { params: category ? { category } : {} });

export const getProductById = (id) => API.get(`/api/products/${id}`);

// Admin only
export const addProduct = (data) => API.post('/api/products', data);
export const deleteProduct = (id) => API.delete(`/api/products/${id}`);
export const updateProduct = (id, data) => API.put(`/api/products/admin/${id}`, data);

// ─── Orders ─────────────────────────────────────────────────────────────────
export const checkoutOrder = (formData) =>
  API.post('/api/orders/checkout', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getOrder = (id) => API.get(`/api/orders/${id}`);
export const getMyOrders = () => API.get('/api/orders/my-orders');

// Admin only
export const getAllOrders = () => API.get('/api/orders/all');
export const updateOrderStatus = (id, status) =>
  API.patch(`/api/orders/${id}/status`, { status });

// ─── User Profile ────────────────────────────────────────────────────────────
export const getUserProfile = () => API.get('/api/user/profile');

// ─── Guest Order Tracking ─────────────────────────────────────────────────────
export const trackGuestOrder = (orderId, email) =>
  API.post('/api/orders/track-guest', { orderId, email });

// ─── Wishlist (Requires Auth) ────────────────────────────────────────────────
export const addToWishlist = (productId) =>
  API.post('/api/wishlist', { productId });

export const getWishlist = () => API.get('/api/wishlist');

export default API;
