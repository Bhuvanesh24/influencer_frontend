import dayjs from 'dayjs';

import type {
  CreateDealInput,
  DealDetail,
  DealDraft,
  DealListItem,
  DealReviews,
  FeeBreakdown,
  Page,
  PerformanceReport,
} from '@/lib/api/collabs';
import type { DealStatus } from '@/lib/deal-status';

import { calcFees, db, MockApiError, money, nowIso, paginate, persistDb, uid, type MockDeal, type MockUser } from './db';
import {
  brandName,
  brandNameForCreator,
  brandUserId,
  completeAndPay,
  creatorName,
  creatorUserId,
  inr,
  notify,
  setStatus,
  tick,
} from './deal-helpers';
import { currentUser } from './session';

const MAX_COUNTER_OFFER_ROUNDS = 2;

type Viewer = { user: MockUser; role: 'brand' | 'creator'; profileId: string };

function viewer(): Viewer {
  const user = currentUser();
  if (user.accountType === 'brand') {
    const brand = db.brands.find((b) => b.userId === user.id);
    if (!brand) throw new MockApiError('Brand profile not found', 404);
    return { user, role: 'brand', profileId: brand.id };
  }
  const creator = db.creators.find((c) => c.userId === user.id);
  if (!creator) throw new MockApiError('Creator profile not found', 404);
  return { user, role: 'creator', profileId: creator.id };
}

function findDeal(id: string, v: Viewer): MockDeal {
  const deal = db.deals.find((d) => d.id === id);
  if (!deal) throw new MockApiError('Deal not found', 404);
  const isParty = v.role === 'brand' ? deal.brandProfileId === v.profileId : deal.creatorProfileId === v.profileId;
  if (!isParty) throw new MockApiError('Access denied', 403);
  return deal;
}

function asBrand(id: string) {
  const v = viewer();
  if (v.role !== 'brand') throw new MockApiError('Only brands can do this', 403);
  return { v, deal: findDeal(id, v) };
}
function asCreator(id: string) {
  const v = viewer();
  if (v.role !== 'creator') throw new MockApiError('This deal is not assigned to you', 403);
  return { v, deal: findDeal(id, v) };
}

// ---- Views ------------------------------------------------------------------------------------

function toListItem(deal: MockDeal, role: 'brand' | 'creator'): DealListItem {
  const brand = db.brands.find((b) => b.id === deal.brandProfileId)!;
  const brandUser = db.users.find((u) => u.id === brand.userId);
  const creator = db.creators.find((c) => c.id === deal.creatorProfileId)!;
  const creatorUser = db.users.find((u) => u.id === creator.userId);
  const pkg = db.packages.find((p) => p.id === deal.packageId);
  const campaign = db.campaigns.find((c) => c.id === deal.campaignId);
  const companyName = role === 'creator' ? brandNameForCreator(deal) : brand.companyName;

  return {
    id: deal.id,
    dealNumber: deal.dealNumber,
    brandProfileId: deal.brandProfileId,
    creatorProfileId: deal.creatorProfileId,
    campaignId: deal.campaignId,
    status: deal.status,
    chatState: deal.chatState,
    contentType: deal.contentType,
    offeredAmount: deal.offeredAmount,
    creatorPayout: deal.creatorPayout,
    counterOfferAmount: deal.counterOfferAmount,
    counterOfferRounds: deal.counterOfferRounds,
    postingDeadline: deal.postingDeadline,
    requestExpiresAt: deal.requestExpiresAt,
    requiresDraftApproval: deal.requiresDraftApproval,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    brandProfile: {
      companyName,
      logoUrl: companyName ? brand.logoUrl : null,
      user: { id: brand.userId, displayName: companyName ? (brandUser?.displayName ?? null) : null, profilePhotoUrl: null },
    },
    creatorProfile: {
      creatorTitle: creator.creatorTitle,
      user: { id: creator.userId, displayName: creatorUser?.displayName ?? null, profilePhotoUrl: creatorUser?.profilePhotoUrl ?? null },
    },
    package: pkg ? { id: pkg.id, title: pkg.title, platform: pkg.platform, contentType: pkg.contentType, price: pkg.price } : null,
    campaign: campaign ? { id: campaign.id, name: campaign.name, requiresDraftApproval: campaign.requiresDraftApproval } : null,
    submissions: deal.submissions.slice(0, 1),
  };
}

function toDetail(deal: MockDeal, role: 'brand' | 'creator'): DealDetail {
  return {
    ...toListItem(deal, role),
    submissions: deal.submissions,
    brief: deal.brief,
    referenceMaterials: deal.referenceMaterials,
    brandNotes: deal.brandNotes,
    brandSideFee: deal.brandSideFee,
    creatorSideFee: deal.creatorSideFee,
    platformCommission: deal.platformCommission,
    acceptedAt: deal.acceptedAt,
    postSubmittedAt: deal.postSubmittedAt,
    verifiedAt: deal.verifiedAt,
    completedAt: deal.completedAt,
    cancelledAt: deal.cancelledAt,
    cancellationReason: deal.cancellationReason,
    statusLog: deal.statusLog,
    escrowTransaction: deal.escrow
      ? {
          status: deal.escrow.status,
          amount: deal.escrow.amount,
          lockedAt: deal.escrow.lockedAt,
          releasedAt: deal.escrow.releasedAt,
          refundedAt: deal.escrow.refundedAt,
        }
      : null,
    disputes: deal.disputes,
    latestSubmission: deal.submissions[0] ?? null,
  };
}

// ---- Reads ------------------------------------------------------------------------------------

export function listDeals(page: number, limit: number, status?: DealStatus): Page<DealListItem> {
  tick();
  const v = viewer();
  const mine = db.deals
    .filter((d) => (v.role === 'brand' ? d.brandProfileId === v.profileId : d.creatorProfileId === v.profileId))
    .filter((d) => !status || d.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { items, pagination } = paginate(mine, page, limit);
  return { items: items.map((d) => toListItem(d, v.role)), pagination };
}

export function getDeal(id: string): DealDetail {
  tick();
  const v = viewer();
  return toDetail(findDeal(id, v), v.role);
}

export function getFeeBreakdown(id: string): FeeBreakdown {
  const v = viewer();
  const deal = findDeal(id, v);
  const fees = calcFees(Number(deal.offeredAmount));
  return {
    dealNumber: deal.dealNumber,
    offeredAmount: deal.offeredAmount,
    brandSideFee: fees.brandSideFee,
    creatorSideFee: fees.creatorSideFee,
    platformCommission: fees.platformCommission,
    brandTotalCost: fees.brandTotalCost,
    creatorNetPayout: fees.creatorPayout,
    platformCommissionRate: '10%',
  };
}

export function listDrafts(id: string): DealDraft[] {
  const deal = findDeal(id, viewer());
  return [...deal.drafts].sort((a, b) => a.round - b.round);
}

export function getDealReviews(id: string): DealReviews {
  const deal = findDeal(id, viewer());
  return {
    reviews: deal.reviews,
    hasReviewed: {
      brand: deal.reviews.some((r) => r.reviewerRole === 'brand'),
      creator: deal.reviews.some((r) => r.reviewerRole === 'creator'),
    },
  };
}

export function getPerformanceReports(id: string): PerformanceReport[] {
  return findDeal(id, viewer()).performanceReports;
}

// ---- Actions ----------------------------------------------------------------------------------

export function createDeal(input: CreateDealInput): { id: string } {
  const v = viewer();
  if (v.role !== 'brand') throw new MockApiError('Only brands can send requests', 403);
  return insertDeal(v.profileId, v.user.id, input);
}

/** Backend `collabService.createDeal`, for any brand — also used by campaign invites/approvals. */
export function insertDeal(brandProfileId: string, brandUserId: string, input: CreateDealInput): { id: string } {
  const creator = db.creators.find((c) => c.id === input.creatorProfileId);
  if (!creator) throw new MockApiError('Creator not found', 404);
  if (!creator.isAvailable) throw new MockApiError('Creator is not available');
  const pkg = db.packages.find((p) => p.id === input.packageId);
  if (!pkg) throw new MockApiError('Package not found', 404);
  if (!pkg.isActive) throw new MockApiError('This package is no longer active');
  if (pkg.creatorProfileId !== creator.id) throw new MockApiError('Package does not belong to the specified creator');
  if (input.brief.trim().length < 10) throw new MockApiError('Brief must be at least 10 characters');

  const offered = input.offeredAmount ?? Number(pkg.price);
  const fees = calcFees(offered);
  const createdAt = nowIso();
  const deal: MockDeal = {
    id: uid(),
    dealNumber: `FC-${1100 + db.deals.length}`,
    brandProfileId,
    creatorProfileId: creator.id,
    campaignId: input.campaignId ?? null,
    packageId: pkg.id,
    status: 'request_sent',
    chatState: 'LOCKED',
    contentType: pkg.contentType,
    brief: input.brief.trim(),
    referenceMaterials: input.referenceMaterials ?? [],
    offeredAmount: money(offered),
    brandSideFee: fees.brandSideFee,
    creatorSideFee: fees.creatorSideFee,
    platformCommission: fees.platformCommission,
    creatorPayout: fees.creatorPayout,
    counterOfferAmount: null,
    counterOfferRounds: 0,
    postingDeadline: input.postingDeadline ?? dayjs().add(7, 'day').toISOString(),
    requiresDraftApproval: input.requiresDraftApproval ?? false,
    requestExpiresAt: dayjs().add(72, 'hour').toISOString(),
    acceptedAt: null,
    postSubmittedAt: null,
    verifiedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    brandNotes: input.brandNotes?.trim() || null,
    createdAt,
    updatedAt: createdAt,
    statusLog: [{ id: uid(), fromStatus: null, toStatus: 'request_sent', changedBy: brandUserId, reason: null, createdAt }],
    submissions: [],
    drafts: [],
    escrow: null,
    disputes: [],
    reviews: [],
    performanceReports: [],
  };
  db.deals.push(deal);
  notify(creator.userId, 'collab_request', 'New collab request', `${brandNameForCreator(deal) ?? 'A brand'} sent a request for ${pkg.title} worth ${inr(offered)}.`, { dealId: deal.id });
  persistDb();
  return { id: deal.id };
}

export function acceptDeal(id: string) {
  tick();
  const { v, deal } = asCreator(id);
  if (deal.status !== 'request_sent') throw new MockApiError(`Cannot accept deal with status: ${deal.status}`);
  if (deal.counterOfferAmount) {
    throw new MockApiError('There is a pending counter-offer. The brand must accept or reject it first.');
  }
  deal.acceptedAt = nowIso();
  setStatus(deal, 'accepted', v.user.id);
  notify(brandUserId(deal), 'collab_accepted', 'Collab accepted', `${creatorName(deal)} accepted ${deal.dealNumber}. Pay to start the collab.`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function rejectDeal(id: string) {
  tick();
  const { v, deal } = asCreator(id);
  if (deal.status !== 'request_sent') throw new MockApiError(`Cannot reject deal with status: ${deal.status}`);
  setStatus(deal, 'rejected', v.user.id);
  notify(brandUserId(deal), 'collab_rejected', 'Request declined', `${creatorName(deal)} declined ${deal.dealNumber}.`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function counterOffer(id: string, amount: number) {
  tick();
  const { v, deal } = asCreator(id);
  if (deal.status !== 'request_sent') throw new MockApiError(`Cannot counter-offer on a deal with status: ${deal.status}`);
  if (deal.counterOfferRounds >= MAX_COUNTER_OFFER_ROUNDS) {
    throw new MockApiError(`Maximum counter-offer rounds (${MAX_COUNTER_OFFER_ROUNDS}) reached`);
  }
  if (!(amount > 0)) throw new MockApiError('Counter offer amount must be positive');
  deal.counterOfferAmount = money(amount);
  deal.counterOfferRounds += 1;
  deal.updatedAt = nowIso();
  deal.statusLog.unshift({
    id: uid(),
    fromStatus: 'request_sent',
    toStatus: 'request_sent',
    changedBy: v.user.id,
    reason: `Counter-offer proposed: ${inr(amount)} (round ${deal.counterOfferRounds})`,
    createdAt: nowIso(),
  });
  notify(brandUserId(deal), 'counter_offer_received', 'Counter-offer received', `${creatorName(deal)} proposed ${inr(amount)} for ${deal.dealNumber} (round ${deal.counterOfferRounds}/${MAX_COUNTER_OFFER_ROUNDS}).`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function acceptCounter(id: string) {
  const { v, deal } = asBrand(id);
  if (deal.status !== 'request_sent') throw new MockApiError(`Cannot accept counter-offer on a deal with status: ${deal.status}`);
  if (!deal.counterOfferAmount) throw new MockApiError('No counter-offer to accept');
  const amount = Number(deal.counterOfferAmount);
  Object.assign(deal, { offeredAmount: money(amount), counterOfferAmount: null, ...withoutTotal(calcFees(amount)) });
  deal.acceptedAt = nowIso();
  setStatus(deal, 'accepted', v.user.id, `Brand accepted counter-offer of ${inr(amount)}`);
  notify(creatorUserId(deal), 'counter_offer_accepted', 'Counter-offer accepted', `${brandName(deal)} accepted your counter-offer of ${inr(amount)}. Payment pending.`, { dealId: deal.id });
  persistDb();
  return { id };
}

function withoutTotal(fees: ReturnType<typeof calcFees>) {
  const { brandTotalCost: _ignored, ...rest } = fees;
  return rest;
}

export function rejectCounter(id: string) {
  const { v, deal } = asBrand(id);
  if (deal.status !== 'request_sent') throw new MockApiError(`Cannot reject counter-offer on a deal with status: ${deal.status}`);
  if (!deal.counterOfferAmount) throw new MockApiError('No counter-offer to reject');
  deal.counterOfferAmount = null;
  setStatus(deal, 'rejected', v.user.id, 'Brand rejected counter-offer');
  notify(creatorUserId(deal), 'counter_offer_rejected', 'Counter-offer declined', `${brandName(deal)} declined your counter-offer for ${deal.dealNumber}.`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function payDeal(id: string) {
  const { v, deal } = asBrand(id);
  if (deal.status !== 'accepted') {
    throw new MockApiError(`Cannot pay for deal with status: ${deal.status}. Must be accepted first.`);
  }
  const fees = calcFees(Number(deal.offeredAmount));
  deal.escrow = {
    id: uid(),
    offeredAmount: deal.offeredAmount,
    brandSideFee: fees.brandSideFee,
    creatorSideFee: fees.creatorSideFee,
    amount: fees.brandTotalCost,
    status: 'held',
    paymentMethod: 'demo',
    paymentGatewayTxnId: `pay_demo_${Date.now().toString(36)}`,
    lockedAt: nowIso(),
    releasedAt: null,
    refundedAt: null,
  };
  deal.chatState = 'OPEN';
  setStatus(deal, 'active', v.user.id);
  notify(creatorUserId(deal), 'payment_prompt', 'Deal is active', `Payment for ${deal.dealNumber} is in escrow. Create and post the content by the deadline.`, { dealId: deal.id });
  persistDb();
  return { id };
}

const POST_URL = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv|stories)\/[\w.-]+/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[\w-]+/i,
};

export function submitPost(
  id: string,
  input: { postUrl: string; platform: 'instagram' | 'youtube'; screenshotUri?: string | null },
) {
  const { v, deal } = asCreator(id);
  if (deal.status !== 'active') throw new MockApiError(`Cannot submit post for deal with status: ${deal.status}`);
  if (deal.requiresDraftApproval && !deal.drafts.some((d) => d.status === 'approved')) {
    throw new MockApiError('Brand must approve your draft before you can submit the post URL.', 403);
  }
  if (!POST_URL[input.platform].test(input.postUrl.trim())) {
    throw new MockApiError(`That doesn't look like a ${input.platform === 'instagram' ? 'Instagram' : 'YouTube'} post link`);
  }
  deal.submissions.unshift({
    id: uid(),
    postUrl: input.postUrl.trim(),
    screenshotUrl: input.screenshotUri ?? null,
    platform: input.platform,
    submittedAt: nowIso(),
    verificationDeadline: dayjs().add(48, 'hour').toISOString(),
    verifiedByBrand: false,
    autoApproved: false,
    verifiedAt: null,
  });
  deal.postSubmittedAt = nowIso();
  setStatus(deal, 'post_submitted', v.user.id);
  notify(brandUserId(deal), 'post_submitted', 'Post submitted for review', `${creatorName(deal)} submitted the post for ${deal.dealNumber}. Verify within 48 hours or it auto-approves.`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function verifyPost(id: string) {
  const { v, deal } = asBrand(id);
  if (deal.status !== 'post_submitted') throw new MockApiError(`Cannot verify deal with status: ${deal.status}`);
  const sub = deal.submissions[0];
  if (sub) {
    sub.verifiedByBrand = true;
    sub.verifiedAt = nowIso();
  }
  setStatus(deal, 'verified', v.user.id);
  completeAndPay(deal, v.user.id);
  persistDb();
  return { id };
}

export function raiseDispute(id: string, input: { reason: string; evidenceUrls?: string[] }) {
  const { v, deal } = asBrand(id);
  if (deal.status !== 'post_submitted') throw new MockApiError('Can only dispute deals with submitted posts');
  if (deal.postSubmittedAt && dayjs().diff(dayjs(deal.postSubmittedAt), 'hour', true) > 48) {
    throw new MockApiError('Dispute window has closed (48 hours after submission)');
  }
  if (input.reason.trim().length < 10) throw new MockApiError('Reason must be at least 10 characters');
  deal.disputes.unshift({
    id: uid(),
    raisedById: v.user.id,
    status: 'raised',
    reason: input.reason.trim(),
    evidenceUrls: input.evidenceUrls ?? [],
    resolutionNotes: null,
    raisedAt: nowIso(),
    resolutionDeadline: dayjs().add(7, 'day').toISOString(),
  });
  if (deal.escrow) deal.escrow.status = 'disputed';
  setStatus(deal, 'disputed', v.user.id, input.reason.trim());
  notify(creatorUserId(deal), 'dispute_update', 'Dispute raised on your deal', `${brandName(deal)} raised a dispute on ${deal.dealNumber}. Trust & Safety will review it.`, { dealId: deal.id });
  persistDb();
  return { id };
}

export function submitDraft(id: string, fileUrl: string): DealDraft {
  const { deal } = asCreator(id);
  if (deal.status !== 'active') throw new MockApiError('Deal must be active to submit a draft');
  const round = Math.max(0, ...deal.drafts.map((d) => d.round)) + 1;
  const draft: DealDraft = {
    id: uid(),
    fileUrl,
    status: 'pending',
    brandFeedback: null,
    round,
    submittedAt: nowIso(),
    reviewedAt: null,
  };
  deal.drafts.push(draft);
  deal.updatedAt = nowIso();
  notify(brandUserId(deal), 'campaign_update', 'Draft ready for review', `${creatorName(deal)} submitted draft ${round} for ${deal.dealNumber}.`, { dealId: deal.id });
  persistDb();
  return draft;
}

export function reviewDraft(id: string, draftId: string, decision: 'approved' | 'changes_requested', feedback?: string) {
  const { deal } = asBrand(id);
  const draft = deal.drafts.find((d) => d.id === draftId);
  if (!draft) throw new MockApiError('Draft not found', 404);
  if (draft.status !== 'pending') throw new MockApiError('Draft is not pending review');
  if (decision === 'changes_requested' && !feedback?.trim()) throw new MockApiError('feedback is required');
  draft.status = decision;
  draft.brandFeedback = feedback?.trim() || null;
  draft.reviewedAt = nowIso();
  deal.updatedAt = nowIso();
  notify(
    creatorUserId(deal),
    'campaign_update',
    decision === 'approved' ? 'Draft approved' : 'Changes requested',
    decision === 'approved'
      ? `${brandName(deal)} approved your draft for ${deal.dealNumber}. You can post it now.`
      : `${brandName(deal)} asked for changes to draft ${draft.round}: ${draft.brandFeedback}`,
    { dealId: deal.id },
  );
  persistDb();
  return draft;
}

export function submitReview(id: string, input: { rating: number; comment?: string }) {
  const v = viewer();
  const deal = findDeal(id, v);
  if (deal.status !== 'completed') throw new MockApiError('Reviews can only be submitted for completed deals');
  if (deal.reviews.some((r) => r.reviewerRole === v.role)) throw new MockApiError('You have already reviewed this deal', 409);
  if (!(input.rating >= 1 && input.rating <= 5)) throw new MockApiError('Rating must be between 1 and 5');
  deal.reviews.push({ id: uid(), reviewerRole: v.role, rating: input.rating, comment: input.comment?.trim() || null, createdAt: nowIso() });
  persistDb();
  return { id };
}

export function submitPerformanceReport(id: string, input: Omit<PerformanceReport, 'id' | 'submittedAt'>) {
  const { deal } = asCreator(id);
  if (deal.status !== 'completed' || !deal.completedAt) {
    throw new MockApiError('Performance reports can only be submitted for completed deals');
  }
  if (deal.performanceReports.some((r) => r.reportType === input.reportType)) {
    throw new MockApiError(`A ${input.reportType === 'seven_day' ? '7-day' : '30-day'} report has already been submitted for this deal`, 409);
  }
  const days = dayjs().diff(dayjs(deal.completedAt), 'day', true);
  if (input.reportType === 'seven_day' && days < 6) {
    throw new MockApiError('The 7-day report can only be submitted from day 6 onwards after deal completion');
  }
  if (input.reportType === 'thirty_day' && days < 28) {
    throw new MockApiError('The 30-day report can only be submitted from day 28 onwards after deal completion');
  }
  deal.performanceReports.push({ ...input, id: uid(), submittedAt: nowIso() });
  persistDb();
  return { id };
}
