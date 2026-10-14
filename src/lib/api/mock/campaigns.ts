import dayjs from 'dayjs';

import type {
  Campaign,
  CampaignApplication,
  CampaignStatus,
  CampaignTracker,
  CreateCampaignInput,
  MyApplication,
  OpenCampaign,
} from '@/lib/api/campaigns';
import type { Page } from '@/lib/api/collabs';
import type { ContentType } from '@/lib/constants';

import { insertDeal } from './collabs';
import { db, MockApiError, money, nowIso, paginate, persistDb, uid, type MockCampaign } from './db';
import { notify, setStatus, tick } from './deal-helpers';
import { currentBrand, currentCreator } from './session';

const FOLLOWER_RANGE_FLOOR: Record<string, number> = {
  under_1k: 0,
  range_1k_10k: 1000,
  range_10k_50k: 10000,
  range_50k_100k: 50000,
  range_100k_500k: 100000,
  range_500k_1m: 500000,
  range_1m_plus: 1000000,
};

function toCampaign(c: MockCampaign): Campaign {
  const brand = db.brands.find((b) => b.id === c.brandProfileId);
  const { brandProfileId: _brandProfileId, ...rest } = c;
  return {
    ...rest,
    brandProfile: brand ? { companyName: brand.companyName, logoUrl: brand.logoUrl } : undefined,
    _count: {
      campaignCreators: db.campaignCreators.filter((cc) => cc.campaignId === c.id).length,
      applications: db.applications.filter((a) => a.campaignId === c.id).length,
    },
  };
}

function ownCampaign(id: string) {
  const brand = currentBrand();
  const c = db.campaigns.find((x) => x.id === id);
  if (!c) throw new MockApiError('Campaign not found', 404);
  if (c.brandProfileId !== brand.id) throw new MockApiError('Not your campaign', 403);
  return { brand, c };
}

// ---- Brand ------------------------------------------------------------------------------------

export function listCampaigns(page: number, limit: number, status?: CampaignStatus): Page<Campaign> {
  const brand = currentBrand();
  const list = db.campaigns
    .filter((c) => c.brandProfileId === brand.id && (!status || c.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { items, pagination } = paginate(list, page, limit);
  return { items: items.map(toCampaign), pagination };
}

/** Readable by its brand, and by creators for open campaigns (the creator detail view). */
export function getCampaign(id: string): Campaign {
  const c = db.campaigns.find((x) => x.id === id);
  if (!c) throw new MockApiError('Campaign not found', 404);
  return toCampaign(c);
}

export function createCampaign(input: CreateCampaignInput): { id: string } {
  const brand = currentBrand();
  if (input.name.trim().length < 3) throw new MockApiError('Name must be at least 3 characters');
  if (input.brief.trim().length < 10) throw new MockApiError('Brief must be at least 10 characters');
  const isOpen = input.type === 'OpenApplication';
  const c: MockCampaign = {
    id: uid(),
    campaignNumber: `CP-${2100 + db.campaigns.length}`,
    brandProfileId: brand.id,
    // Open campaigns go live at once; brand-invite ones stay draft until creators are added.
    status: isOpen ? 'active' : 'draft',
    type: input.type,
    name: input.name.trim(),
    productDescription: input.productDescription?.trim() || null,
    brief: input.brief.trim(),
    contentType: input.contentType,
    hashtags: input.hashtags,
    targetLanguages: input.targetLanguages,
    targetNiches: input.targetNiches,
    targetInfluencerCount: isOpen ? input.maxCreators : input.targetInfluencerCount,
    totalBudget: money(isOpen ? input.budgetPerCreator * input.maxCreators : input.totalBudget),
    postingDeadline: input.postingDeadline,
    minFollowerCount: isOpen ? (input.minFollowerCount ?? null) : null,
    minEngagementRate: isOpen && input.minEngagementRate !== undefined ? input.minEngagementRate.toFixed(2) : null,
    budgetPerCreator: isOpen ? money(input.budgetPerCreator) : null,
    maxCreators: isOpen ? input.maxCreators : null,
    applicationDeadline: isOpen ? input.applicationDeadline : null,
    autoAccept: isOpen ? input.autoAccept : false,
    negotiationAllowed: input.negotiationAllowed,
    requiresDraftApproval: input.requiresDraftApproval,
    usedSlots: 0,
    spentAmount: '0.00',
    refundedAmount: '0.00',
    createdAt: nowIso(),
  };
  db.campaigns.push(c);
  persistDb();
  return { id: c.id };
}

export function setCampaignStatus(id: string, status: 'active' | 'paused') {
  const { c } = ownCampaign(id);
  if (['completed', 'cancelled'].includes(c.status)) throw new MockApiError('Cannot update a completed or cancelled campaign');
  c.status = status;
  persistDb();
}

export function cancelCampaign(id: string) {
  const { brand, c } = ownCampaign(id);
  if (['completed', 'cancelled'].includes(c.status)) throw new MockApiError(`Campaign is already ${c.status}`);
  let dealsCancelled = 0;
  let escrowRefunded = 0;
  for (const deal of db.deals.filter((d) => d.campaignId === c.id)) {
    if (['completed', 'cancelled', 'disputed', 'rejected', 'expired'].includes(deal.status)) continue;
    setStatus(deal, 'cancelled', brand.userId, 'Campaign cancelled by brand');
    deal.cancelledAt = nowIso();
    deal.cancellationReason = 'Campaign cancelled by brand';
    deal.chatState = 'ARCHIVED';
    dealsCancelled += 1;
    if (deal.escrow?.status === 'held') {
      deal.escrow.status = 'refunded';
      deal.escrow.refundedAt = nowIso();
      c.refundedAmount = money(Number(c.refundedAmount) + Number(deal.offeredAmount));
      escrowRefunded += 1;
    }
    const creatorUser = db.creators.find((x) => x.id === deal.creatorProfileId)?.userId;
    if (creatorUser) {
      notify(creatorUser, 'system', 'Campaign cancelled', `A campaign you were part of was cancelled by the brand. ${deal.dealNumber} has been closed.`, { dealId: deal.id });
    }
  }
  c.status = 'cancelled';
  persistDb();
  return { dealsCancelled, escrowRefunded };
}

export function getTracker(id: string): CampaignTracker {
  tick();
  const { c } = ownCampaign(id);
  const deals = db.deals.filter((d) => d.campaignId === c.id);
  return {
    creators: deals
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((deal) => {
        const creator = db.creators.find((x) => x.id === deal.creatorProfileId)!;
        const user = db.users.find((u) => u.id === creator.userId);
        const cc = db.campaignCreators.find((x) => x.dealId === deal.id);
        return {
          id: deal.id,
          campaignCreatorId: cc?.id ?? deal.id,
          status: deal.status,
          offeredAmount: deal.offeredAmount,
          dealNumber: deal.dealNumber,
          creatorProfile: { id: creator.id, user: { displayName: user?.displayName ?? null, profilePhotoUrl: user?.profilePhotoUrl ?? null } },
        };
      }),
    summary: {
      totalCreators: deals.length,
      targetCount: c.targetInfluencerCount,
      totalBudget: c.totalBudget,
      spentAmount: money(deals.filter((d) => d.escrow && d.escrow.status !== 'refunded').reduce((s, d) => s + Number(d.offeredAmount), 0)),
      refundedAmount: c.refundedAmount,
    },
  };
}

export function inviteCreators(id: string, creators: { creatorProfileId: string; packageId: string; offeredAmount?: number }[]) {
  const { brand, c } = ownCampaign(id);
  if (c.type !== 'BrandInvite') throw new MockApiError('Open campaigns take applications instead of invites');
  if (['completed', 'cancelled'].includes(c.status)) throw new MockApiError(`Campaign is ${c.status}`);
  const active = db.campaignCreators.filter((cc) => {
    if (cc.campaignId !== c.id) return false;
    const deal = db.deals.find((d) => d.id === cc.dealId);
    return !deal || !['rejected', 'expired'].includes(deal.status);
  });
  const available = c.targetInfluencerCount - active.length;
  if (creators.length > available) {
    throw new MockApiError(`Only ${available} slot(s) remaining. Increase target influencer count to invite more.`);
  }
  if (creators.some((x) => active.some((cc) => cc.creatorProfileId === x.creatorProfileId))) {
    throw new MockApiError('Creator already invited to this campaign: DUPLICATE_INVITE', 409);
  }
  for (const x of creators) {
    const { id: dealId } = insertDeal(brand.id, brand.userId, {
      creatorProfileId: x.creatorProfileId,
      packageId: x.packageId,
      brief: c.brief,
      offeredAmount: x.offeredAmount,
      campaignId: c.id,
      postingDeadline: c.postingDeadline,
      requiresDraftApproval: c.requiresDraftApproval,
    });
    const deal = db.deals.find((d) => d.id === dealId)!;
    db.campaignCreators.push({ id: uid(), campaignId: c.id, creatorProfileId: x.creatorProfileId, dealId, offeredAmount: deal.offeredAmount, addedAt: nowIso() });
  }
  if (c.status === 'draft') c.status = 'active';
  persistDb();
}

function toApplication(a: (typeof db.applications)[number]): CampaignApplication {
  const creator = db.creators.find((x) => x.id === a.creatorProfileId)!;
  const user = db.users.find((u) => u.id === creator.userId);
  const pkg = db.packages.find((p) => p.id === a.packageId)!;
  const deal = a.dealId ? db.deals.find((d) => d.id === a.dealId) : null;
  return {
    id: a.id,
    status: a.status,
    pitchNote: a.pitchNote,
    reviewNote: a.reviewNote,
    appliedAt: a.appliedAt,
    reviewedAt: a.reviewedAt,
    creatorProfile: {
      id: creator.id,
      trustScore: creator.trustScore,
      followerRange: creator.instagramFollowerRange ?? creator.youtubeSubscriberRange,
      user: { id: creator.userId, displayName: user?.displayName ?? null, profilePhotoUrl: user?.profilePhotoUrl ?? null },
      niches: creator.niches.map((niche) => ({ niche })),
    },
    package: { id: pkg.id, title: pkg.title, contentType: pkg.contentType, price: pkg.price },
    deal: deal ? { id: deal.id, dealNumber: deal.dealNumber, status: deal.status } : null,
  };
}

export function listApplications(id: string, status?: CampaignApplication['status']): CampaignApplication[] {
  const { c } = ownCampaign(id);
  return db.applications
    .filter((a) => a.campaignId === c.id && (!status || a.status === status))
    .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
    .map(toApplication);
}

function approve(c: MockCampaign, app: (typeof db.applications)[number], brandUserId: string, note?: string) {
  if (c.maxCreators != null && c.usedSlots >= c.maxCreators) throw new MockApiError('All slots for this campaign are filled');
  const { id: dealId } = insertDeal(c.brandProfileId, brandUserId, {
    creatorProfileId: app.creatorProfileId,
    packageId: app.packageId,
    brief: c.brief,
    offeredAmount: c.budgetPerCreator ? Number(c.budgetPerCreator) : undefined,
    campaignId: c.id,
    postingDeadline: c.postingDeadline,
    requiresDraftApproval: c.requiresDraftApproval,
  });
  app.status = 'approved';
  app.reviewedAt = nowIso();
  app.reviewNote = note ?? null;
  app.dealId = dealId;
  c.usedSlots += 1;
  const creatorUser = db.creators.find((x) => x.id === app.creatorProfileId)!.userId;
  notify(creatorUser, 'application_update', 'Application approved', `Your application to “${c.name}” was approved. Accept the request to get started.`, { dealId, campaignId: c.id });
}

export function reviewApplication(campaignId: string, appId: string, action: 'approve' | 'decline', reviewNote?: string) {
  const { brand, c } = ownCampaign(campaignId);
  const app = db.applications.find((a) => a.id === appId);
  if (!app) throw new MockApiError('Application not found', 404);
  if (app.campaignId !== c.id) throw new MockApiError('Application does not belong to this campaign');
  if (app.status !== 'pending') throw new MockApiError(`Application is already ${app.status}`);
  if (action === 'approve') {
    approve(c, app, brand.userId, reviewNote);
  } else {
    app.status = 'declined';
    app.reviewedAt = nowIso();
    app.reviewNote = reviewNote ?? null;
    const creatorUser = db.creators.find((x) => x.id === app.creatorProfileId)!.userId;
    notify(creatorUser, 'application_update', 'Application not selected', `Your application to “${c.name}” was not selected.`, { campaignId: c.id });
  }
  persistDb();
  return toApplication(app);
}

// ---- Creator ----------------------------------------------------------------------------------

/** Mirrors listOpenCampaigns' eligibility: active, deadline ahead, not applied, followers/engagement/niche fit. */
export function listOpenCampaigns(f: { contentType?: ContentType; niche?: string }, page: number, limit: number): Page<OpenCampaign> {
  const creator = currentCreator();
  const followers = FOLLOWER_RANGE_FLOOR[creator.instagramFollowerRange ?? ''] ?? 0;
  const engagement = Number(creator.instagramEngagementRate ?? 0);
  const myNiches = new Set(creator.niches.map((n) => n.toLowerCase()));
  const applied = new Set(db.applications.filter((a) => a.creatorProfileId === creator.id).map((a) => a.campaignId));
  const now = dayjs();

  const list = db.campaigns
    .filter((c) => {
      if (c.type !== 'OpenApplication' || c.status !== 'active') return false;
      if (!c.applicationDeadline || !dayjs(c.applicationDeadline).isAfter(now)) return false;
      if (applied.has(c.id)) return false;
      if (c.minFollowerCount && c.minFollowerCount > followers) return false;
      if (c.minEngagementRate && Number(c.minEngagementRate) > engagement) return false;
      if (f.contentType && c.contentType !== f.contentType) return false;
      const targets = c.targetNiches.map((n) => n.toLowerCase());
      if (f.niche && !targets.includes(f.niche.toLowerCase())) return false;
      if (targets.length === 0 || myNiches.size === 0) return true;
      return targets.some((t) => myNiches.has(t));
    })
    .sort((a, b) => (a.applicationDeadline ?? '').localeCompare(b.applicationDeadline ?? ''));

  const { items, pagination } = paginate(list, page, limit);
  return {
    pagination,
    items: items.map((c) => {
      const brand = db.brands.find((b) => b.id === c.brandProfileId);
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        contentType: c.contentType,
        targetNiches: c.targetNiches,
        budgetPerCreator: c.budgetPerCreator,
        maxCreators: c.maxCreators,
        usedSlots: c.usedSlots,
        slotsRemaining: c.maxCreators != null ? c.maxCreators - c.usedSlots : null,
        applicationDeadline: c.applicationDeadline!,
        minFollowerCount: c.minFollowerCount,
        minEngagementRate: c.minEngagementRate,
        autoAccept: c.autoAccept,
        createdAt: c.createdAt,
        brandProfile: { companyName: brand?.companyName ?? null, logoUrl: brand?.logoUrl ?? null },
      };
    }),
  };
}

export function apply(id: string, input: { packageId: string; pitchNote?: string }) {
  const creator = currentCreator();
  const c = db.campaigns.find((x) => x.id === id);
  if (!c) throw new MockApiError('Campaign not found', 404);
  if (c.type !== 'OpenApplication') throw new MockApiError('This campaign does not accept open applications');
  if (c.status !== 'active') throw new MockApiError('This campaign is not accepting applications');
  if (!c.applicationDeadline || dayjs(c.applicationDeadline).isBefore(dayjs())) throw new MockApiError('Application deadline has passed');
  if (c.maxCreators != null && c.usedSlots >= c.maxCreators) throw new MockApiError('All slots for this campaign are filled');
  const followers = FOLLOWER_RANGE_FLOOR[creator.instagramFollowerRange ?? ''] ?? 0;
  if (c.minFollowerCount && followers < c.minFollowerCount) {
    throw new MockApiError(`Minimum ${c.minFollowerCount.toLocaleString('en-IN')} followers required for this campaign`);
  }
  const pkg = db.packages.find((p) => p.id === input.packageId);
  if (!pkg) throw new MockApiError('Package not found', 404);
  if (pkg.creatorProfileId !== creator.id) throw new MockApiError('Package does not belong to you');
  if (!pkg.isActive) throw new MockApiError('Package is no longer active');
  if (input.pitchNote !== undefined && input.pitchNote.trim().length > 0 && input.pitchNote.trim().length < 10) {
    throw new MockApiError('Pitch note must be at least 10 characters');
  }
  if (db.applications.some((a) => a.campaignId === c.id && a.creatorProfileId === creator.id)) {
    throw new MockApiError('You have already applied to this campaign', 409);
  }
  const app = {
    id: uid(),
    campaignId: c.id,
    creatorProfileId: creator.id,
    packageId: pkg.id,
    pitchNote: input.pitchNote?.trim() || null,
    status: 'pending' as const,
    reviewedAt: null,
    reviewNote: null,
    dealId: null,
    appliedAt: nowIso(),
  };
  db.applications.push(app);
  const brandUser = db.brands.find((b) => b.id === c.brandProfileId)!.userId;
  notify(brandUser, 'application_update', 'New campaign application', `A creator applied to your campaign “${c.name}”.`, { campaignId: c.id });
  if (c.autoAccept) approve(c, db.applications[db.applications.length - 1], brandUser, 'Auto-approved');
  persistDb();
  return { id: app.id, status: db.applications[db.applications.length - 1].status };
}

export function getMyApplications(): MyApplication[] {
  const creator = currentCreator();
  return db.applications
    .filter((a) => a.creatorProfileId === creator.id)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((a) => {
      const c = db.campaigns.find((x) => x.id === a.campaignId)!;
      const brand = db.brands.find((b) => b.id === c.brandProfileId);
      const pkg = db.packages.find((p) => p.id === a.packageId)!;
      const deal = a.dealId ? db.deals.find((d) => d.id === a.dealId) : null;
      return {
        id: a.id,
        status: a.status,
        pitchNote: a.pitchNote,
        reviewNote: a.reviewNote,
        appliedAt: a.appliedAt,
        campaign: {
          id: c.id,
          name: c.name,
          contentType: c.contentType,
          budgetPerCreator: c.budgetPerCreator,
          applicationDeadline: c.applicationDeadline,
          brandProfile: { companyName: brand?.companyName ?? null, logoUrl: brand?.logoUrl ?? null },
        },
        package: { id: pkg.id, title: pkg.title, price: pkg.price },
        deal: deal ? { id: deal.id, dealNumber: deal.dealNumber, status: deal.status } : null,
      };
    });
}
