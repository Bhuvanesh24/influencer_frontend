import type { BrandDashboard, BrandProfile, BrandProfileUpdate } from '@/lib/api/brand';

import { db, money, persistDb, type MockBrand, type MockDeal } from './db';
import { tick } from './deal-helpers';
import { currentBrand } from './session';

export function toBrandProfile(b: MockBrand): BrandProfile {
  return {
    id: b.id,
    companyName: b.companyName,
    brandWebsite: b.brandWebsite,
    industry: b.industry,
    description: b.description,
    country: b.country,
    phone: b.phone,
    gstin: b.gstin,
    logoUrl: b.logoUrl,
    showBrandNameInCollabs: b.showBrandNameInCollabs,
  };
}

export function getProfile(): BrandProfile {
  return toBrandProfile(currentBrand());
}

export function updateProfile(input: BrandProfileUpdate) {
  const b = currentBrand();
  Object.assign(b, { ...input, brandWebsite: input.brandWebsite ?? null });
  persistDb();
}

const IN_PROGRESS = ['request_sent', 'accepted', 'payment_pending', 'active', 'post_submitted', 'disputed'];

function toDashboardDeal(deal: MockDeal) {
  const creator = db.creators.find((c) => c.id === deal.creatorProfileId);
  const user = creator && db.users.find((u) => u.id === creator.userId);
  const pkg = db.packages.find((p) => p.id === deal.packageId);
  return {
    id: deal.id,
    dealNumber: deal.dealNumber,
    status: deal.status,
    offeredAmount: deal.offeredAmount,
    postingDeadline: deal.postingDeadline,
    creatorProfile: creator
      ? {
          creatorTitle: creator.creatorTitle,
          user: { displayName: user?.displayName ?? null, profilePhotoUrl: user?.profilePhotoUrl ?? null },
        }
      : null,
    package: pkg ? { title: pkg.title, contentType: pkg.contentType } : null,
  };
}

export function getDashboard(): BrandDashboard {
  tick();
  const b = currentBrand();
  const deals = db.deals
    .filter((d) => d.brandProfileId === b.id)
    .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
  const campaigns = db.campaigns
    .filter((c) => c.brandProfileId === b.id)
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt));

  return {
    profile: { id: b.id, companyName: b.companyName, logoUrl: b.logoUrl },
    stats: {
      totalSpent: money(deals.filter((d) => d.escrow).reduce((sum, d) => sum + Number(d.offeredAmount), 0)),
      activeCollabs: deals.filter((d) => ['active', 'post_submitted'].includes(d.status)).length,
      pendingApprovals: deals.filter((d) => d.status === 'post_submitted').length,
      openCampaigns: campaigns.filter((c) => c.status === 'active').length,
    },
    // Posts waiting for review first, then everything else still in progress.
    recentCollabs: deals
      .filter((d) => IN_PROGRESS.includes(d.status))
      .sort((x, y) => Number(y.status === 'post_submitted') - Number(x.status === 'post_submitted'))
      .slice(0, 6)
      .map(toDashboardDeal),
    recentCampaigns: campaigns.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      targetInfluencerCount: c.targetInfluencerCount,
      createdAt: c.createdAt,
    })),
  };
}
