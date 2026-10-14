import dayjs from 'dayjs';

import type { BrandAnalytics, EscrowTransaction } from '@/lib/api/billing';
import type { Page } from '@/lib/api/collabs';

import { db, MockApiError, money, paginate, type MockDeal } from './db';
import { tick } from './deal-helpers';
import { currentBrand } from './session';

function toTransaction(deal: MockDeal): EscrowTransaction {
  const e = deal.escrow!;
  const creator = db.creators.find((c) => c.id === deal.creatorProfileId);
  const user = creator && db.users.find((u) => u.id === creator.userId);
  return {
    id: e.id,
    offeredAmount: e.offeredAmount,
    brandSideFee: e.brandSideFee,
    creatorSideFee: e.creatorSideFee,
    amount: e.amount,
    status: e.status,
    paymentMethod: e.paymentMethod,
    paymentGatewayTxnId: e.paymentGatewayTxnId,
    lockedAt: e.lockedAt,
    releasedAt: e.releasedAt,
    refundedAt: e.refundedAt,
    createdAt: e.lockedAt,
    deal: {
      id: deal.id,
      dealNumber: deal.dealNumber,
      status: deal.status,
      contentType: deal.contentType,
      creatorProfile: { user: { displayName: user?.displayName ?? null, profilePhotoUrl: user?.profilePhotoUrl ?? null } },
    },
  };
}

function paidDeals() {
  const brand = currentBrand();
  return db.deals.filter((d) => d.brandProfileId === brand.id && d.escrow);
}

export function getBillingHistory(page: number, limit: number): Page<EscrowTransaction> {
  tick();
  const list = paidDeals().sort((a, b) => b.escrow!.lockedAt.localeCompare(a.escrow!.lockedAt));
  const { items, pagination } = paginate(list, page, limit);
  return { items: items.map(toTransaction), pagination };
}

export function getBillingTransaction(id: string): EscrowTransaction {
  const deal = paidDeals().find((d) => d.escrow!.id === id);
  if (!deal) throw new MockApiError('Transaction not found', 404);
  return toTransaction(deal);
}

const DONE = ['completed', 'auto_approved'];

export function getBrandAnalytics(): BrandAnalytics {
  tick();
  const brand = currentBrand();
  const deals = db.deals.filter((d) => d.brandProfileId === brand.id);
  const completed = deals.filter((d) => DONE.includes(d.status));
  const accepted = deals.filter((d) => !['request_sent', 'rejected', 'cancelled', 'expired'].includes(d.status));
  const gross = (d: MockDeal) => Number(d.offeredAmount) + Number(d.brandSideFee);

  const from = dayjs().subtract(5, 'month').startOf('month');
  const monthly = new Map<string, number>();
  for (let i = 0; i < 6; i++) monthly.set(from.add(i, 'month').format('YYYY-MM'), 0);
  for (const d of completed) {
    const key = d.completedAt?.slice(0, 7);
    if (key && monthly.has(key)) monthly.set(key, monthly.get(key)! + gross(d));
  }

  const byType = new Map<string, { count: number; amount: number }>();
  for (const d of deals) {
    const t = byType.get(d.contentType) ?? { count: 0, amount: 0 };
    byType.set(d.contentType, { count: t.count + 1, amount: t.amount + Number(d.offeredAmount) });
  }

  const byCreator = new Map<string, { count: number; paid: number }>();
  const byNiche = new Map<string, number>();
  for (const d of completed) {
    const c = byCreator.get(d.creatorProfileId) ?? { count: 0, paid: 0 };
    byCreator.set(d.creatorProfileId, { count: c.count + 1, paid: c.paid + gross(d) });
    const niche = db.creators.find((x) => x.id === d.creatorProfileId)?.niches[0];
    if (niche) byNiche.set(niche, (byNiche.get(niche) ?? 0) + gross(d));
  }

  return {
    summary: {
      totalSpend: money(deals.filter((d) => d.escrow).reduce((s, d) => s + Number(d.offeredAmount), 0)),
      totalCollabs: deals.filter((d) => d.escrow).length,
      totalCampaigns: db.campaigns.filter((c) => c.brandProfileId === brand.id).length,
      completedDeals: completed.length,
      acceptedDeals: accepted.length,
      totalDeals: deals.length,
      conversionRate: deals.length ? Math.round((completed.length / deals.length) * 1000) / 10 : 0,
      acceptanceRate: deals.length ? Math.round((accepted.length / deals.length) * 1000) / 10 : 0,
    },
    funnel: { sent: deals.length, accepted: accepted.length, completed: completed.length },
    byContentType: [...byType.entries()].map(([contentType, v]) => ({
      contentType: contentType as BrandAnalytics['byContentType'][number]['contentType'],
      count: v.count,
      totalAmount: money(v.amount),
    })),
    monthlySpend: [...monthly.entries()].map(([month, amount]) => ({ month, amount: money(amount) })),
    topCreators: [...byCreator.entries()]
      .sort((a, b) => b[1].count - a[1].count || b[1].paid - a[1].paid)
      .slice(0, 10)
      .map(([id, v]) => {
        const creator = db.creators.find((c) => c.id === id)!;
        const user = db.users.find((u) => u.id === creator.userId);
        return {
          creatorProfileId: id,
          displayName: user?.displayName ?? null,
          profilePhotoUrl: user?.profilePhotoUrl ?? null,
          niches: creator.niches,
          dealCount: v.count,
          totalPaid: money(v.paid),
        };
      }),
    byNiche: [...byNiche.entries()].sort((a, b) => b[1] - a[1]).map(([niche, amount]) => ({ niche, amount: money(amount) })),
  };
}
