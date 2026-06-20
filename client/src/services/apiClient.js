import axios from 'axios';

const resolveApiBaseUrl = () => {
  const isBrowser = typeof window !== 'undefined';
  const onLocalhost =
    isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Deployed: the API runs as same-origin serverless functions under /api.
  // Always use it so a stale VITE_API_BASE_URL can never point at a dead server.
  if (!onLocalhost) {
    return '/api';
  }

  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  return 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
