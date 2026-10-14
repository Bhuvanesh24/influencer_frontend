import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FollowerRange } from '@/components/ui/Badge';
import type { AccountType } from '@/lib/auth/types';
import type { ContentType } from '@/lib/constants';
import type { DealStatus } from '@/lib/deal-status';
import type { TrustScore } from '@/lib/theme';

/**
 * DEV-ONLY in-memory database behind mock mode (`IS_MOCK_API`). One store holds every entity, in
 * the shape of the backend's Prisma models (influencer_backend/prisma/schema.prisma), so both
 * demo accounts see the same deals, messages and campaigns: what the brand does shows up for the
 * creator after switching accounts. Saved to AsyncStorage after every change so a demo survives
 * an app reload. Delete the whole `mock/` folder when the app is bound to the real backend.
 */

export type Iso = string;
export type Money = string;

export interface MockUser {
  id: string;
  email: string;
  password: string | null;
  accountType: AccountType | null;
  displayName: string | null;
  profilePhotoUrl: string | null;
  hasBankAccount: boolean;
  phoneVerified: boolean;
  createdAt: Iso;
}

export interface MockCreator {
  id: string;
  userId: string;
  creatorTitle: string | null;
  bio: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  dateOfBirth: Iso | null;
  country: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  languages: string[];
  niches: string[];
  instagramHandle: string | null;
  instagramFollowerRange: FollowerRange | null;
  youtubeChannelUrl: string | null;
  youtubeSubscriberRange: FollowerRange | null;
  featuredReelUrl: string | null;
  coverPhotos: string[];
  phoneNumber: string | null;
  phoneVerified: boolean;
  isAvailable: boolean;
  trustScore: TrustScore;
  trustScorePoints: number;
  /** Self-reported, from the latest stats submission. Never shown as an exact follower count. */
  instagramEngagementRate: string | null;
  verificationStatus: 'pending' | 'verified' | 'verified_with_caveat' | 'rejected';
  totalCompletedCollabs: number;
  createdAt: Iso;
}

export interface MockBrand {
  id: string;
  userId: string;
  companyName: string | null;
  brandWebsite: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  phone: string | null;
  gstin: string | null;
  logoUrl: string | null;
  showBrandNameInCollabs: boolean;
  createdAt: Iso;
}

export interface MockPackage {
  id: string;
  creatorProfileId: string;
  title: string;
  contentType: ContentType;
  quantity: number;
  price: Money;
  description: string | null;
  inclusions: string[];
  platform: 'instagram' | 'youtube' | 'both' | null;
  recommendedMin: Money | null;
  recommendedMax: Money | null;
  isActive: boolean;
  createdAt: Iso;
}

export interface MockStatusLog {
  id: string;
  fromStatus: DealStatus | null;
  toStatus: DealStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: Iso;
}

export interface MockSubmission {
  id: string;
  postUrl: string;
  screenshotUrl: string | null;
  platform: 'instagram' | 'youtube';
  submittedAt: Iso;
  verificationDeadline: Iso;
  verifiedByBrand: boolean;
  autoApproved: boolean;
  verifiedAt: Iso | null;
}

export interface MockDraft {
  id: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'changes_requested';
  brandFeedback: string | null;
  round: number;
  submittedAt: Iso;
  reviewedAt: Iso | null;
}

export interface MockEscrow {
  id: string;
  offeredAmount: Money;
  brandSideFee: Money;
  creatorSideFee: Money;
  amount: Money;
  status: 'held' | 'released' | 'refunded' | 'partial_release' | 'disputed';
  paymentMethod: string;
  paymentGatewayTxnId: string;
  lockedAt: Iso;
  releasedAt: Iso | null;
  refundedAt: Iso | null;
}

export interface MockDispute {
  id: string;
  raisedById: string;
  status: 'raised' | 'under_review' | 'resolved_for_brand' | 'resolved_for_creator' | 'partial' | 'dismissed';
  reason: string;
  evidenceUrls: string[];
  resolutionNotes: string | null;
  raisedAt: Iso;
  resolutionDeadline: Iso;
}

export interface MockReview {
  id: string;
  reviewerRole: 'brand' | 'creator';
  rating: number;
  comment: string | null;
  createdAt: Iso;
}

export interface MockPerformanceReport {
  id: string;
  reportType: 'seven_day' | 'thirty_day';
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  submittedAt: Iso;
}

export interface MockDeal {
  id: string;
  dealNumber: string;
  brandProfileId: string;
  creatorProfileId: string;
  campaignId: string | null;
  packageId: string | null;
  status: DealStatus;
  chatState: 'LOCKED' | 'OPEN' | 'ARCHIVED';
  contentType: ContentType;
  brief: string;
  referenceMaterials: string[];
  offeredAmount: Money;
  brandSideFee: Money;
  creatorSideFee: Money;
  platformCommission: Money;
  creatorPayout: Money;
  counterOfferAmount: Money | null;
  counterOfferRounds: number;
  postingDeadline: Iso;
  requiresDraftApproval: boolean;
  requestExpiresAt: Iso | null;
  acceptedAt: Iso | null;
  postSubmittedAt: Iso | null;
  verifiedAt: Iso | null;
  completedAt: Iso | null;
  cancelledAt: Iso | null;
  cancellationReason: string | null;
  brandNotes: string | null;
  createdAt: Iso;
  updatedAt: Iso;
  statusLog: MockStatusLog[];
  submissions: MockSubmission[];
  drafts: MockDraft[];
  escrow: MockEscrow | null;
  disputes: MockDispute[];
  reviews: MockReview[];
  performanceReports: MockPerformanceReport[];
}

export interface MockCampaign {
  id: string;
  campaignNumber: string;
  brandProfileId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  type: 'BrandInvite' | 'OpenApplication';
  name: string;
  productDescription: string | null;
  brief: string;
  contentType: ContentType;
  hashtags: string[];
  targetLanguages: string[];
  targetNiches: string[];
  targetInfluencerCount: number;
  totalBudget: Money;
  postingDeadline: Iso;
  minFollowerCount: number | null;
  minEngagementRate: string | null;
  budgetPerCreator: Money | null;
  maxCreators: number | null;
  applicationDeadline: Iso | null;
  autoAccept: boolean;
  negotiationAllowed: boolean;
  requiresDraftApproval: boolean;
  /** Approved applications (open campaigns); includes seeded creators outside the mock. */
  usedSlots: number;
  spentAmount: Money;
  refundedAmount: Money;
  createdAt: Iso;
}

export interface MockCampaignCreator {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  dealId: string | null;
  offeredAmount: Money;
  addedAt: Iso;
}

export interface MockApplication {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  packageId: string;
  pitchNote: string | null;
  status: 'pending' | 'approved' | 'declined';
  reviewedAt: Iso | null;
  reviewNote: string | null;
  dealId: string | null;
  appliedAt: Iso;
}

export interface MockMessage {
  id: string;
  dealId: string;
  senderId: string;
  receiverId: string;
  content: string;
  readReceipt: 'sent' | 'delivered' | 'read';
  isReported: boolean;
  /** Absent on seeded messages. */
  attachmentUrls?: string[];
  attachmentMimeTypes?: string[];
  createdAt: Iso;
}

export interface MockNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  dealId: string | null;
  campaignId: string | null;
  isRead: boolean;
  createdAt: Iso;
}

export interface MockPayoutAccount {
  id: string;
  userId: string;
  accountType: 'upi' | 'bank_account';
  upiId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: Iso;
}

export interface MockPayout {
  id: string;
  creatorProfileId: string;
  dealId: string;
  offeredAmount: Money;
  creatorSideFee: Money;
  amount: Money;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  isOnHold: boolean;
  holdReason: string | null;
  failedReason: string | null;
  payoutMethod: string | null;
  createdAt: Iso;
  completedAt: Iso | null;
}

export interface MockSavedList {
  id: string;
  brandProfileId: string;
  name: string;
  creatorProfileIds: string[];
  createdAt: Iso;
}

export interface MockStatsSubmission {
  id: string;
  creatorProfileId: string;
  instagramFollowers: number | null;
  instagramEngRate: string | null;
  instagramAvgLikes: number | null;
  instagramAvgComments: number | null;
  youtubeSubscribers: number | null;
  youtubeAvgViews: number | null;
  screenshotUrls: string[];
  verificationStatus: 'pending' | 'verified' | 'verified_with_caveat' | 'rejected';
  reviewNotes: string | null;
  submittedAt: Iso;
  reviewedAt: Iso | null;
}

export interface MockDb {
  version: number;
  users: MockUser[];
  creators: MockCreator[];
  brands: MockBrand[];
  packages: MockPackage[];
  deals: MockDeal[];
  campaigns: MockCampaign[];
  campaignCreators: MockCampaignCreator[];
  applications: MockApplication[];
  messages: MockMessage[];
  notifications: MockNotification[];
  payoutAccounts: MockPayoutAccount[];
  payouts: MockPayout[];
  savedLists: MockSavedList[];
  statsSubmissions: MockStatsSubmission[];
}

/** Bump when the seed or a table's shape changes, so stale saved data is replaced. */
export const MOCK_DB_VERSION = 2;
const STORAGE_KEY = 'findcollab.mockDb';

export function emptyDb(): MockDb {
  return {
    version: MOCK_DB_VERSION,
    users: [],
    creators: [],
    brands: [],
    packages: [],
    deals: [],
    campaigns: [],
    campaignCreators: [],
    applications: [],
    messages: [],
    notifications: [],
    payoutAccounts: [],
    payouts: [],
    savedLists: [],
    statsSubmissions: [],
  };
}

/** The live database. Its tables are swapped wholesale by `replaceDb` (seed, reset, load). */
export const db: MockDb = emptyDb();

export function replaceDb(next: MockDb) {
  Object.assign(db, next);
}

export async function loadDbFromStorage(): Promise<MockDb | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDb;
    return parsed.version === MOCK_DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write-behind; losing the last change on a crash is fine for a demo. */
export function persistDb() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => {});
  }, 300);
}

export async function clearStoredDb() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

// ---- Helpers ----------------------------------------------------------------------------------

export function uid(): string {
  // UUID-shaped, so ids look like the backend's.
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
}

export function nowIso(): Iso {
  return new Date().toISOString();
}

export function money(value: number): Money {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Backend `calcFees`: 10% from each side; the creator is paid the offer minus their 10%. */
export function calcFees(offered: number) {
  const brandSideFee = offered * 0.1;
  const creatorSideFee = offered * 0.1;
  return {
    brandSideFee: money(brandSideFee),
    creatorSideFee: money(creatorSideFee),
    platformCommission: money(brandSideFee + creatorSideFee),
    creatorPayout: money(offered - creatorSideFee),
    brandTotalCost: money(offered + brandSideFee),
  };
}

/** An error shaped like the backend's `ApiError`, so screens show the same messages. */
export class MockApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function paginate<T>(items: T[], page = 1, limit = 20) {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) },
  };
}

export function byNewest<T>(key: keyof T) {
  return (a: T, b: T) => String(b[key]).localeCompare(String(a[key]));
}
