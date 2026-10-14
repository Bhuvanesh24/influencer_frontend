import dayjs from 'dayjs';

import type { DealStatus } from '@/lib/deal-status';

import { db, nowIso, persistDb, uid, type MockDeal } from './db';

export function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  refs: { dealId?: string; campaignId?: string } = {},
) {
  db.notifications.push({
    id: uid(),
    userId,
    type,
    title,
    body,
    dealId: refs.dealId ?? null,
    campaignId: refs.campaignId ?? null,
    isRead: false,
    createdAt: nowIso(),
  });
}

export function brandUserId(deal: MockDeal) {
  return db.brands.find((b) => b.id === deal.brandProfileId)!.userId;
}
export function creatorUserId(deal: MockDeal) {
  return db.creators.find((c) => c.id === deal.creatorProfileId)!.userId;
}
export function creatorName(deal: MockDeal) {
  return db.users.find((u) => u.id === creatorUserId(deal))?.displayName ?? 'The creator';
}
export function brandName(deal: MockDeal) {
  return db.brands.find((b) => b.id === deal.brandProfileId)?.companyName ?? 'The brand';
}
export function inr(amount: string | number) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function setStatus(deal: MockDeal, to: DealStatus, changedBy: string | null, reason: string | null = null) {
  deal.statusLog.unshift({ id: uid(), fromStatus: deal.status, toStatus: to, changedBy, reason, createdAt: nowIso() });
  deal.status = to;
  deal.updatedAt = nowIso();
}

/**
 * Stands in for the backend's cron jobs, run on every read: unanswered requests expire after
 * their window, unverified posts auto-approve after 48h, and payouts settle shortly after release.
 */
export function tick() {
  const now = dayjs();
  let changed = false;
  for (const deal of db.deals) {
    if (deal.status === 'request_sent' && deal.requestExpiresAt && dayjs(deal.requestExpiresAt).isBefore(now)) {
      setStatus(deal, 'expired', null, 'No response before the request expired');
      changed = true;
    }
    const sub = deal.submissions[0];
    if (deal.status === 'post_submitted' && sub?.verificationDeadline && dayjs(sub.verificationDeadline).isBefore(now)) {
      sub.autoApproved = true;
      sub.verifiedAt = nowIso();
      setStatus(deal, 'auto_approved', null, 'Not verified within 48 hours');
      completeAndPay(deal, null);
      changed = true;
    }
  }
  for (const payout of db.payouts) {
    if (payout.status === 'processing' && dayjs(payout.createdAt).isBefore(now.subtract(2, 'minute'))) {
      payout.status = 'completed';
      payout.completedAt = nowIso();
      changed = true;
    }
  }
  if (changed) persistDb();
}

/** Escrow release + payout + completion — shared by verify and auto-approve. */
export function completeAndPay(deal: MockDeal, changedBy: string | null) {
  deal.verifiedAt = nowIso();
  if (deal.escrow) {
    deal.escrow.status = 'released';
    deal.escrow.releasedAt = nowIso();
  }
  db.payouts.push({
    id: uid(),
    creatorProfileId: deal.creatorProfileId,
    dealId: deal.id,
    offeredAmount: deal.offeredAmount,
    creatorSideFee: deal.creatorSideFee,
    amount: deal.creatorPayout,
    status: 'processing',
    isOnHold: false,
    holdReason: null,
    failedReason: null,
    payoutMethod: 'bank_account',
    createdAt: nowIso(),
    completedAt: null,
  });
  const creator = db.creators.find((c) => c.id === deal.creatorProfileId);
  if (creator) creator.totalCompletedCollabs += 1;
  setStatus(deal, 'completed', changedBy);
  deal.completedAt = nowIso();
  deal.chatState = 'ARCHIVED';
  notify(creatorUserId(deal), 'payout_released', 'Payment released', `Your payment for ${deal.dealNumber} has been released. Amount: ${inr(deal.creatorPayout)}.`, { dealId: deal.id });
}


const UNTIL_PAID = ['request_sent', 'accepted', 'rejected', 'expired'];

/** What a creator sees of the brand: "A Brand" (null) until the deal is paid, if it hides its name. */
export function brandNameForCreator(deal: MockDeal): string | null {
  const brand = db.brands.find((b) => b.id === deal.brandProfileId);
  if (!brand) return null;
  if (!brand.showBrandNameInCollabs && UNTIL_PAID.includes(deal.status)) return null;
  return brand.companyName;
}

