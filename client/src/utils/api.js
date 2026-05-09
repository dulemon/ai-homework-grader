import { getNativePlatform, isNativeApp } from './platform';
import { getStoredApiBaseUrl, getStoredAuth } from './storage';

const DEFAULT_NATIVE_API_BASE = {
  android: 'http://10.0.2.2:3001/api',
  ios: 'http://localhost:3001/api',
  web: 'http://localhost:3001/api'
};

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

function getConfiguredEnvBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }
  return '';
}

function getDefaultApiBaseUrl() {
  if (!isNativeApp()) {
    return '/api';
  }

  const platform = getNativePlatform();
  return DEFAULT_NATIVE_API_BASE[platform] || DEFAULT_NATIVE_API_BASE.web;
}

export function normalizeApiBaseUrl(baseUrl) {
  return normalizeBaseUrl(baseUrl.trim());
}

export function getRecommendedApiBaseUrl() {
  return getConfiguredEnvBaseUrl() || getDefaultApiBaseUrl();
}

async function getApiBaseUrl() {
  const stored = await getStoredApiBaseUrl();
  if (stored) {
    return normalizeBaseUrl(stored);
  }

  const configured = getConfiguredEnvBaseUrl();
  if (configured) {
    return configured;
  }

  return getDefaultApiBaseUrl();
}

export async function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath === '/api'
    ? ''
    : normalizedPath.startsWith('/api/')
      ? normalizedPath.slice(4)
      : normalizedPath;

  return `${await getApiBaseUrl()}${apiPath}`;
}

export async function apiFetch(path, options = {}) {
  const auth = await getStoredAuth();
  const headers = new Headers(options.headers || {});
  const body = options.body;

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  const url = await buildApiUrl(path);

  return fetch(url, {
    ...options,
    headers
  });
}
