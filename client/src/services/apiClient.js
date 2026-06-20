import axios from 'axios';

const normalizeApiBaseUrl = (value) => {
  const raw = (value || '').trim().replace(/\/+$/, '');

  if (raw) {
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Production: same-origin /api (proxied to server in client/vercel.json)
    return '/api';
  }

  return 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
