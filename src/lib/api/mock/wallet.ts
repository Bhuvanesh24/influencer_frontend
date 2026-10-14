import dayjs from 'dayjs';

import type { Page } from '@/lib/api/collabs';
import type { NewPayoutAccount, Payout, PayoutAccount, PayoutStatus, WalletSummary } from '@/lib/api/wallet';

import { db, MockApiError, money, nowIso, paginate, persistDb, uid, type MockPayoutAccount } from './db';
import { brandNameForCreator, tick } from './deal-helpers';
import { currentCreator, currentUser } from './session';

function toAccount(a: MockPayoutAccount): PayoutAccount {
  return {
    id: a.id,
    accountType: a.accountType,
    upiId: a.upiId,
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    accountHolderName: a.accountHolderName,
    isPrimary: a.isPrimary,
    isVerified: a.isVerified,
    createdAt: a.createdAt,
  };
}

function sum(list: { amount: string }[]) {
  return money(list.reduce((s, p) => s + Number(p.amount), 0));
}

export function getWalletSummary(): WalletSummary {
  tick();
  const c = currentCreator();
  const payouts = db.payouts.filter((p) => p.creatorProfileId === c.id);
  const completed = payouts.filter((p) => p.status === 'completed');
  const pending = payouts.filter((p) => p.status === 'pending' && !p.isOnHold);
  const processing = payouts.filter((p) => p.status === 'processing');
  const failed = payouts.filter((p) => p.status === 'failed');
  const onHold = payouts.filter((p) => p.isOnHold);
  const primary = db.payoutAccounts.find((a) => a.userId === c.userId && a.isPrimary);
  return {
    totalEarned: sum(completed),
    totalFeesPaid: money(completed.reduce((s, p) => s + Number(p.creatorSideFee), 0)),
    totalCompletedPayouts: completed.length,
    pending: { amount: sum(pending), count: pending.length },
    processing: { amount: sum(processing), count: processing.length },
    failed: { amount: sum(failed), count: failed.length },
    onHold: { amount: sum(onHold), count: onHold.length },
    primaryAccount: primary ? toAccount(primary) : null,
  };
}

export function getPayouts(page: number, limit: number, status?: PayoutStatus): Page<Payout> {
  tick();
  const c = currentCreator();
  const list = db.payouts
    .filter((p) => p.creatorProfileId === c.id && (!status || p.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { items, pagination } = paginate(list, page, limit);
  return {
    pagination,
    items: items.map((p) => {
      const deal = db.deals.find((d) => d.id === p.dealId)!;
      const brand = db.brands.find((b) => b.id === deal.brandProfileId);
      const name = brandNameForCreator(deal);
      return {
        id: p.id,
        offeredAmount: p.offeredAmount,
        creatorSideFee: p.creatorSideFee,
        amount: p.amount,
        status: p.status,
        isOnHold: p.isOnHold,
        holdReason: p.holdReason,
        payoutMethod: p.payoutMethod,
        completedAt: p.completedAt,
        failedReason: p.failedReason,
        createdAt: p.createdAt,
        deal: {
          id: deal.id,
          dealNumber: deal.dealNumber,
          contentType: deal.contentType,
          brandProfile: { companyName: name, logoUrl: name ? (brand?.logoUrl ?? null) : null },
          package: deal.packageId ? { title: db.packages.find((x) => x.id === deal.packageId)?.title ?? '' } : null,
        },
      };
    }),
  };
}

/** Completed payouts per month, oldest first, including empty months so the chart has a gap. */
export function getMonthlyEarnings(months: number) {
  const c = currentCreator();
  const from = dayjs().subtract(months - 1, 'month').startOf('month');
  const totals = new Map<string, number>();
  for (let i = 0; i < months; i++) totals.set(from.add(i, 'month').format('YYYY-MM'), 0);
  for (const p of db.payouts) {
    if (p.creatorProfileId !== c.id || p.status !== 'completed' || !p.completedAt) continue;
    const key = p.completedAt.slice(0, 7);
    if (totals.has(key)) totals.set(key, totals.get(key)! + Number(p.amount));
  }
  return [...totals.entries()].map(([month, amount]) => ({ month, amount: money(amount) }));
}

export function listPayoutAccounts(): PayoutAccount[] {
  const user = currentUser();
  return db.payoutAccounts
    .filter((a) => a.userId === user.id)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.createdAt.localeCompare(a.createdAt))
    .map(toAccount);
}

export function addPayoutAccount(input: NewPayoutAccount): PayoutAccount {
  const user = currentUser();
  if (input.accountType === 'upi') {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(input.upiId.trim())) throw new MockApiError('Enter a valid UPI ID, like name@bank');
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifscCode)) {
    throw new MockApiError('Invalid IFSC code');
  }
  const mine = db.payoutAccounts.filter((a) => a.userId === user.id);
  const account: MockPayoutAccount = {
    id: uid(),
    userId: user.id,
    accountType: input.accountType,
    upiId: input.accountType === 'upi' ? input.upiId.trim() : null,
    bankName: input.accountType === 'bank_account' ? input.bankName : null,
    accountNumber: input.accountType === 'bank_account' ? input.accountNumber : null,
    ifscCode: input.accountType === 'bank_account' ? input.ifscCode : null,
    accountHolderName: input.accountType === 'bank_account' ? input.accountHolderName : null,
    isPrimary: mine.length === 0,
    isVerified: false,
    createdAt: nowIso(),
  };
  db.payoutAccounts.push(account);
  persistDb();
  return toAccount(account);
}

function ownAccount(id: string) {
  const user = currentUser();
  const account = db.payoutAccounts.find((a) => a.id === id);
  if (!account) throw new MockApiError('Payout account not found', 404);
  if (account.userId !== user.id) throw new MockApiError('Not your account', 403);
  return { user, account };
}

export function setPrimary(id: string) {
  const { user } = ownAccount(id);
  db.payoutAccounts.filter((a) => a.userId === user.id).forEach((a) => (a.isPrimary = a.id === id));
  persistDb();
}

export function deleteAccount(id: string) {
  const { user, account } = ownAccount(id);
  // Payouts in flight go to the primary account; that one can't be removed until they settle.
  const creator = db.creators.find((c) => c.userId === user.id);
  const inFlight = creator && db.payouts.some((p) => p.creatorProfileId === creator.id && ['pending', 'processing'].includes(p.status));
  if (account.isPrimary && inFlight) {
    throw new MockApiError('Cannot delete account with a pending or processing payout');
  }
  db.payoutAccounts.splice(db.payoutAccounts.indexOf(account), 1);
  if (account.isPrimary) {
    const next = db.payoutAccounts.filter((a) => a.userId === user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (next) next.isPrimary = true;
  }
  persistDb();
}
