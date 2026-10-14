import * as billing from '@/lib/api/mock/billing';
import * as collabs from '@/lib/api/mock/collabs';
import { replaceDb } from '@/lib/api/mock/db';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from '@/lib/api/mock/seed';
import { mockLogin } from '@/lib/api/mock/session';
import * as wallet from '@/lib/api/mock/wallet';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const asBrand = () => mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
const asCreator = () => mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);

beforeEach(() => replaceDb(seedDb()));

describe('mock wallet and billing', () => {
  it('counts only paid-out money as earned, and shows a verified post as on its way', () => {
    asCreator();
    const before = wallet.getWalletSummary();
    expect(before.totalEarned).toBe('18000.00'); // deal-6 paid out; deal-7 is on hold
    expect(before.onHold.count).toBe(1);
    expect(before.processing.count).toBe(0);

    collabs.submitPost('deal-4', { postUrl: 'https://www.instagram.com/reel/live1', platform: 'instagram' });
    asBrand();
    collabs.verifyPost('deal-4');

    asCreator();
    const after = wallet.getWalletSummary();
    expect(after.totalEarned).toBe(before.totalEarned);
    expect(after.processing.count).toBe(1);
    expect(wallet.getPayouts(1, 20).items[0].deal.id).toBe('deal-4');
  });

  it('keeps one primary payout account and refuses to remove it while a payout is in flight', () => {
    asCreator();
    const accounts = wallet.listPayoutAccounts();
    expect(accounts.filter((a) => a.isPrimary)).toHaveLength(1);
    const primary = accounts.find((a) => a.isPrimary)!;
    expect(() => wallet.deleteAccount(primary.id)).toThrow(/pending or processing/); // deal-7 is pending

    const other = accounts.find((a) => !a.isPrimary)!;
    wallet.setPrimary(other.id);
    expect(wallet.listPayoutAccounts().find((a) => a.isPrimary)!.id).toBe(other.id);
  });

  it('lists the brand escrow payments with where the money is', () => {
    asBrand();
    const items = billing.getBillingHistory(1, 50).items;
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((t) => t.status))).toEqual(new Set(['held', 'released']));
    expect(billing.getBrandAnalytics().funnel.sent).toBeGreaterThan(billing.getBrandAnalytics().funnel.completed);
  });
});
