import type { CompleteOnboardingInput } from '@/lib/api/auth';
import type { AuthSession } from '@/lib/auth/types';

import { db, MockApiError, nowIso, persistDb, uid } from './db';
import { currentUser, mockLogin, sessionOf } from './session';

export const MOCK_OTP_CODE = '888999';

/** `POST /auth/complete-onboarding`: sets the role and creates the empty profile + bank account. */
export function mockCompleteOnboarding(input: CompleteOnboardingInput): AuthSession {
  const user = currentUser();
  if (user.accountType) throw new MockApiError('Onboarding already completed', 409);

  user.accountType = input.accountType;
  user.displayName = input.displayName;
  user.hasBankAccount = true;
  const createdAt = nowIso();

  if (input.accountType === 'creator') {
    db.creators.push({
      id: uid(),
      userId: user.id,
      creatorTitle: null,
      bio: null,
      gender: null,
      dateOfBirth: null,
      country: 'India',
      state: null,
      district: null,
      city: null,
      languages: [],
      niches: [],
      instagramHandle: null,
      instagramFollowerRange: null,
      youtubeChannelUrl: null,
      youtubeSubscriberRange: null,
      featuredReelUrl: null,
      coverPhotos: [],
      phoneNumber: null,
      phoneVerified: false,
      isAvailable: true,
      trustScore: 'medium',
      trustScorePoints: 0,
      instagramEngagementRate: null,
      verificationStatus: 'pending',
      totalCompletedCollabs: 0,
      createdAt,
    });
  } else {
    db.brands.push({
      id: uid(),
      userId: user.id,
      companyName: null,
      brandWebsite: null,
      industry: null,
      description: null,
      country: 'India',
      phone: null,
      gstin: null,
      logoUrl: null,
      showBrandNameInCollabs: true,
      createdAt,
    });
  }

  db.payoutAccounts.push({
    id: uid(),
    userId: user.id,
    accountType: 'bank_account',
    upiId: null,
    bankName: input.bankAccount.bankName,
    accountNumber: input.bankAccount.accountNumber,
    ifscCode: input.bankAccount.ifscCode,
    accountHolderName: input.bankAccount.accountHolderName,
    isPrimary: true,
    isVerified: false,
    createdAt,
  });
  if (input.upiId) {
    db.payoutAccounts.push({
      id: uid(),
      userId: user.id,
      accountType: 'upi',
      upiId: input.upiId,
      bankName: null,
      accountNumber: null,
      ifscCode: null,
      accountHolderName: null,
      isPrimary: false,
      isVerified: false,
      createdAt,
    });
  }
  persistDb();
  return sessionOf(user);
}

/** Google sign-in has no browser hop in mock mode: it signs in one fixed new-user account. */
export function mockGoogleLogin(): AuthSession {
  return mockLogin('google.user@example.com', '');
}

const pendingPhone: { phone: string | null } = { phone: null };

export function mockSendPhoneOtp(phone: string) {
  currentUser();
  pendingPhone.phone = phone;
}

export function mockVerifyPhoneOtp(phone: string, otp: string) {
  if (otp !== MOCK_OTP_CODE) {
    throw new MockApiError(`Invalid code — use ${MOCK_OTP_CODE} in this mock build.`);
  }
  const user = currentUser();
  user.phoneVerified = true;
  const creator = db.creators.find((c) => c.userId === user.id);
  if (creator) {
    creator.phoneNumber = phone || pendingPhone.phone;
    creator.phoneVerified = true;
  }
  persistDb();
}

export function mockChangePassword(currentPassword: string, newPassword: string) {
  const user = currentUser();
  if (user.password && user.password !== currentPassword) {
    throw new MockApiError('Current password is incorrect');
  }
  user.password = newPassword;
  persistDb();
}
