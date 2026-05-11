import axios from 'axios';

// Optimized Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Ideal for adding Auth tokens and deduplication indicators
api.interceptors.request.use(
  (config) => {
    // Add logic here if needed (e.g., localStorage token)
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Ideal for global error handling and data extraction
api.interceptors.response.use(
  (response) => response.data, // Automatically extract .data
  (error) => {
    // Global error handler
    if (error.response?.status === 401) {
      // Redirect to login or handle session expire
    }
    return Promise.reject(error);
  }
);

export default api;
