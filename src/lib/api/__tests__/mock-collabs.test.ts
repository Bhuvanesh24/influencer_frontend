import * as collabs from '@/lib/api/mock/collabs';
import { db, replaceDb } from '@/lib/api/mock/db';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from '@/lib/api/mock/seed';
import { mockLogin } from '@/lib/api/mock/session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const asBrand = () => mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
const asCreator = () => mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);

beforeEach(() => replaceDb(seedDb()));

describe('mock collab lifecycle', () => {
  it('runs a direct collab from request to payout across both demo accounts', () => {
    asBrand();
    const { id } = collabs.createDeal({
      creatorProfileId: 'cr-aanya',
      packageId: 'pk-aanya-reel',
      brief: 'A reel brewing our new green tea.',
    });

    asCreator();
    expect(collabs.getDeal(id).status).toBe('request_sent');
    expect(db.notifications.some((n) => n.userId === DEMO_ACCOUNTS.creator.userId && n.dealId === id)).toBe(true);
    collabs.acceptDeal(id);

    asBrand();
    expect(collabs.getFeeBreakdown(id)).toMatchObject({ offeredAmount: '12000.00', brandTotalCost: '13200.00', creatorNetPayout: '10800.00' });
    collabs.payDeal(id);
    expect(collabs.getDeal(id)).toMatchObject({ status: 'active', chatState: 'OPEN' });

    asCreator();
    expect(() => collabs.submitPost(id, { postUrl: 'https://example.com/x', platform: 'instagram' })).toThrow(/Instagram/);
    collabs.submitPost(id, { postUrl: 'https://www.instagram.com/reel/abc123', platform: 'instagram' });

    asBrand();
    collabs.verifyPost(id);
    const done = collabs.getDeal(id);
    expect(done.status).toBe('completed');
    expect(done.escrowTransaction?.status).toBe('released');
    expect(db.payouts.find((p) => p.dealId === id)).toMatchObject({ amount: '10800.00', status: 'processing' });
  });

  it('settles a counter-offer at the new price', () => {
    asCreator();
    collabs.counterOffer('deal-1', 15000);
    expect(() => collabs.acceptDeal('deal-1')).toThrow(/counter-offer/);

    mockLogin('hello@kettleandcrumb.example', DEMO_PASSWORD);
    collabs.acceptCounter('deal-1');
    const deal = collabs.getDeal('deal-1');
    expect(deal).toMatchObject({ status: 'accepted', offeredAmount: '15000.00', counterOfferAmount: null, creatorPayout: '13500.00' });
  });

  it('caps counter-offers at two rounds', () => {
    asCreator();
    collabs.counterOffer('deal-2', 7000);
    db.deals.find((d) => d.id === 'deal-2')!.counterOfferAmount = null;
    collabs.counterOffer('deal-2', 6500);
    db.deals.find((d) => d.id === 'deal-2')!.counterOfferAmount = null;
    expect(() => collabs.counterOffer('deal-2', 6400)).toThrow(/Maximum/);
  });

  it('blocks posting until the brand approves a draft', () => {
    mockLogin('ishita@creators.example', DEMO_PASSWORD);
    expect(() => collabs.submitPost('deal-12', { postUrl: 'https://www.instagram.com/reel/x1', platform: 'instagram' })).toThrow(/approve/);

    asBrand();
    const pending = collabs.listDrafts('deal-12').find((d) => d.status === 'pending')!;
    collabs.reviewDraft('deal-12', pending.id, 'approved');

    mockLogin('ishita@creators.example', DEMO_PASSWORD);
    collabs.submitPost('deal-12', { postUrl: 'https://www.instagram.com/reel/x1', platform: 'instagram' });
    expect(collabs.getDeal('deal-12').status).toBe('post_submitted');
  });

  it('hides a private brand from the creator until the deal is paid', () => {
    asCreator();
    expect(collabs.getDeal('deal-2').brandProfile.companyName).toBeNull();
    expect(collabs.getDeal('deal-4').brandProfile.companyName).toBe('Monsoon Tea Co.');
  });

  it('expires requests whose window has passed', () => {
    db.deals.find((d) => d.id === 'deal-1')!.requestExpiresAt = new Date(Date.now() - 1000).toISOString();
    asCreator();
    expect(collabs.getDeal('deal-1').status).toBe('expired');
  });

  it('refuses access to a deal that belongs to someone else', () => {
    asCreator();
    expect(() => collabs.getDeal('deal-9')).toThrow(/Access denied/);
  });
});
