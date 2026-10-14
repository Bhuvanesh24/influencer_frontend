import type { AxiosRequestConfig } from 'axios';

import { apiClient } from '@/lib/api/client';
import * as mockAuth from '@/lib/api/mock/auth';
import { mockLogin, mockLogout } from '@/lib/api/mock/session';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { AccountType, AuthSession } from '@/lib/auth/types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export async function login(input: { email: string; password: string }): Promise<AuthSession> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mockLogin(input.email, input.password);
  }
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>('/auth/login', input);
  return data.data;
}

export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  if (IS_MOCK_API) {
    return mockDelay({ url: '' });
  }
  const { data } = await apiClient.get<ApiEnvelope<{ url: string }>>('/auth/google/url');
  return data.data;
}

export async function googleCallback(input: { code: string; state?: string }): Promise<AuthSession> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mockAuth.mockGoogleLogin();
  }
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>('/auth/google/callback', input);
  return data.data;
}

export async function forgotPassword(input: { email: string }): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return;
  }
  await apiClient.post('/auth/forgot-password', input);
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return;
  }
  await apiClient.post('/auth/reset-password', input);
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mockAuth.mockChangePassword(input.currentPassword, input.newPassword);
    return;
  }
  await apiClient.post('/auth/change-password', input);
}

/** `POST /auth/logout` — best effort; the local session is cleared regardless. */
export async function logout(): Promise<void> {
  if (IS_MOCK_API) {
    mockLogout();
    return;
  }
  await apiClient.post('/auth/logout');
}

export interface CompleteOnboardingInput {
  accountType: AccountType;
  displayName: string;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  upiId?: string;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
  config?: AxiosRequestConfig,
): Promise<AuthSession> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mockAuth.mockCompleteOnboarding(input);
  }
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>(
    '/auth/complete-onboarding',
    input,
    config,
  );
  return data.data;
}

export async function sendPhoneOtp(input: { phone: string }): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mockAuth.mockSendPhoneOtp(input.phone);
    return;
  }
  await apiClient.post('/auth/phone/send-otp', input);
}

export async function verifyPhoneOtp(input: { phone: string; otp: string }): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mockAuth.mockVerifyPhoneOtp(input.phone, input.otp);
    return;
  }
  await apiClient.post('/auth/phone/verify-otp', input);
}
