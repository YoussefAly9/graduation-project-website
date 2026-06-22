import apiClient from './apiClient.js';

export const warmUpApi = async () => {
  try {
    const response = await apiClient.get('/status', { timeout: 30000 });
    return response.data;
  } catch {
    return null;
  }
};
