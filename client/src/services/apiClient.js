import axios from 'axios';

const normalizeApiBaseUrl = (value) => {
  const fallback = 'http://localhost:5000/api';
  const raw = (value || fallback).trim().replace(/\/+$/, '');

  if (raw.endsWith('/api')) {
    return raw;
  }

  return `${raw}/api`;
};

const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;


