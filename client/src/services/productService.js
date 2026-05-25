import apiClient from './apiClient.js';

export const fetchProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data.data;
};


