import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { FOCUS_API_URL, KIDS_API_URL, SENSE_API_URL } from '../constants';
import { STORAGE_KEYS } from '../constants';
import { useAuthStore } from '@/store/authStore';

/** Токен: сначала localStorage (для обычного браузера), затем store (для Mini App WebView, где localStorage может не сохраняться). */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (fromStorage) return fromStorage;
  return useAuthStore.getState().accessToken;
}

/** Focus service: при пустом FOCUS_API_URL запросы идут через прокси Next.js (/api-focus -> backend:3001) */
const focusBaseURL = FOCUS_API_URL ? `${FOCUS_API_URL}/api` : '/api-focus';
export const focusApi: AxiosInstance = axios.create({
  baseURL: focusBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

focusApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

focusApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

/** Kids service: при пустом KIDS_API_URL запросы идут через прокси Next.js (/api-kids -> backend:8001) */
const kidsBaseURL = KIDS_API_URL ? `${KIDS_API_URL}/api` : '/api-kids';
export const kidsApi: AxiosInstance = axios.create({
  baseURL: kidsBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

kidsApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Отключаем кеш GET, чтобы после редиректа данные подтягивались заново
  if (config.method?.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
  }
  return config;
});

kidsApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

/** Sense service: при пустом SENSE_API_URL запросы идут через прокси Next.js (/api-sense -> backend:8002) */
const senseBaseURL = SENSE_API_URL ? `${SENSE_API_URL}/api` : '/api-sense';
export const senseApi: AxiosInstance = axios.create({
  baseURL: senseBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

senseApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.method?.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
  }
  return config;
});

senseApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);
