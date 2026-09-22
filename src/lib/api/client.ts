import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

import { useAuthStore } from '@/lib/auth/store';
import { toast } from '@/lib/toast';

/** Configurable per environment (app.config.ts `extra.apiBaseUrl` / EXPO_PUBLIC_API_BASE_URL) — prompt.md §10. */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000';

export interface ApiErrorShape {
  success: false;
  message: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    /** Set by a screen that maps 422/400 `errors[]` onto its own form fields (prompt.md §5) —
     * skips the global toast so the error isn't surfaced twice. */
    skipGlobalErrorToast?: boolean;
  }
}

let refreshPromise: Promise<string | null> | null = null;

/** Exported so the Splash screen can do its silent-refresh check (prompt.md §6.1) on launch. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) return null;

  try {
    const response = await axios.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

    const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
    useAuthStore.getState().setTokens({ accessToken, refreshToken: nextRefreshToken });
    return accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Coalesce concurrent 401s into a single refresh call.
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }

      // Refresh itself failed — force logout. The root layout's gate redirects to Login
      // (prompt.md §5 "Session expiry") once `tokens` becomes null.
      useAuthStore.getState().clear();
      toast.error('Session expired', 'Please log in again.');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isFieldValidationError = status === 400 || status === 422;
    if (!originalRequest?.skipGlobalErrorToast && !(isFieldValidationError && error.response?.data?.errors?.length)) {
      toast.error('Something went wrong', getApiErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

/** Narrows an unknown axios error into the backend's `{success:false, message, ...}` envelope. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong on our end — try again.'): string {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
