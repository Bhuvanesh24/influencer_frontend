import type { AxiosRequestConfig } from 'axios';

import { apiClient } from '@/lib/api/client';
import type { AccountType, AuthSession } from '@/lib/auth/types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export async function login(input: { email: string; password: string }): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>('/auth/login', input);
  return data.data;
}

export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  const { data } = await apiClient.get<ApiEnvelope<{ url: string }>>('/auth/google/url');
  return data.data;
}

export async function googleCallback(input: { code: string; state?: string }): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>('/auth/google/callback', input);
  return data.data;
}

export async function forgotPassword(input: { email: string }): Promise<void> {
  await apiClient.post('/auth/forgot-password', input);
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await apiClient.post('/auth/reset-password', input);
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post('/auth/change-password', input);
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
  const { data } = await apiClient.post<ApiEnvelope<AuthSession>>(
    '/auth/complete-onboarding',
    input,
    config,
  );
  return data.data;
}

export async function sendPhoneOtp(input: { phone: string }): Promise<void> {
  await apiClient.post('/auth/phone/send-otp', input);
}

export async function verifyPhoneOtp(input: { phone: string; otp: string }): Promise<void> {
  await apiClient.post('/auth/phone/verify-otp', input);
}
