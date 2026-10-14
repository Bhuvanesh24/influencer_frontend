import * as campaigns from '@/lib/api/mock/campaigns';
import * as collabs from '@/lib/api/mock/collabs';
import { db, replaceDb } from '@/lib/api/mock/db';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from '@/lib/api/mock/seed';
import { mockLogin } from '@/lib/api/mock/session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const asBrand = () => mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
const asCreator = () => mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);
const inTen = () => new Date(Date.now() + 10 * 86400000).toISOString();

beforeEach(() => replaceDb(seedDb()));

describe('mock campaigns', () => {
  it('shows a creator only open campaigns that fit, and hides ones already applied to', () => {
    asCreator();
    const names = campaigns.listOpenCampaigns({}, 1, 20).items.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Weekend bakes', 'Festive gift boxes']));
    expect(names).not.toContain('Glow serum launch'); // Beauty/Fashion — not Aanya's niches
    expect(names).not.toContain('Monsoon treks'); // already applied
  });

  it('runs an open-application campaign from apply to an approved collab request', () => {
    asCreator();
    campaigns.apply('cp-gift-boxes', { packageId: 'pk-aanya-reel', pitchNote: 'A chai and mithai pairing reel.' });
    expect(() => campaigns.apply('cp-gift-boxes', { packageId: 'pk-aanya-reel' })).toThrow(/already applied/);

    asBrand();
    const app = campaigns.listApplications('cp-gift-boxes', 'pending').find((a) => a.creatorProfile.id === 'cr-aanya')!;
    campaigns.reviewApplication('cp-gift-boxes', app.id, 'approve');

    asCreator();
    const mine = campaigns.getMyApplications().find((a) => a.campaign.id === 'cp-gift-boxes')!;
    expect(mine.status).toBe('approved');
    expect(collabs.getDeal(mine.deal!.id)).toMatchObject({ status: 'request_sent', offeredAmount: '10000.00', campaignId: 'cp-gift-boxes' });
  });

  it('auto-approves on a campaign with auto-accept', () => {
    asCreator();
    const result = campaigns.apply('cp-weekend-bakes', { packageId: 'pk-aanya-reel' });
    expect(result.status).toBe('approved');
  });

  it('creates a brand-invite campaign as a draft that goes live with the first invite', () => {
    asBrand();
    const { id } = campaigns.createCampaign({
      type: 'BrandInvite',
      name: 'Spring teas',
      brief: 'Show our spring blends in your morning routine.',
      contentType: 'reel',
      hashtags: [],
      targetLanguages: [],
      targetNiches: ['Food'],
      postingDeadline: inTen(),
      negotiationAllowed: true,
      requiresDraftApproval: false,
      totalBudget: 50000,
      targetInfluencerCount: 1,
    });
    expect(campaigns.getCampaign(id).status).toBe('draft');
    campaigns.inviteCreators(id, [{ creatorProfileId: 'cr-kabir', packageId: 'pk-kabir-reel' }]);
    expect(campaigns.getCampaign(id).status).toBe('active');
    expect(() => campaigns.inviteCreators(id, [{ creatorProfileId: 'cr-arjun', packageId: 'pk-arjun-post' }])).toThrow(/slot/);
  });

  it('cancels a campaign, closing open collabs', () => {
    asBrand();
    const result = campaigns.cancelCampaign('cp-chai-launch');
    expect(result.dealsCancelled).toBe(2); // Meera (accepted) and Sana (request sent)
    expect(db.deals.find((d) => d.id === 'deal-15')!.status).toBe('cancelled');
    expect(campaigns.getCampaign('cp-chai-launch').status).toBe('cancelled');
  });
});
