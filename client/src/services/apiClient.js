import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  const isBrowser = typeof window !== 'undefined';
  const onLocalhost =
    isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Ignore localhost env URL when the site is deployed (common Vercel misconfiguration).
  if (envUrl && !(envUrl.includes('localhost') && !onLocalhost)) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  if (onLocalhost) {
    return 'http://localhost:5000/api';
  }

  // Production: same-origin /api (proxied to server in client/vercel.json)
  return '/api';
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
