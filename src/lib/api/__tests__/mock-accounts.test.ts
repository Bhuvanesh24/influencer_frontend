import { db } from '@/lib/api/mock/db';
import * as creatorMock from '@/lib/api/mock/creator';
import * as brandMock from '@/lib/api/mock/brand';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/api/mock/seed';
import { ensureDb, mockLogin, session } from '@/lib/api/mock/session';
import { mockCompleteOnboarding } from '@/lib/api/mock/auth';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeAll(() => ensureDb());

describe('mock demo accounts', () => {
  it('signs in to a finished creator account with a dashboard built from its deals', () => {
    const { user } = mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);
    expect(user).toMatchObject({ accountType: 'creator', hasBankAccount: true });

    const dashboard = creatorMock.getDashboard();
    const requests = db.deals.filter((d) => d.creatorProfileId === dashboard.profile.id && d.status === 'request_sent');
    expect(dashboard.stats.newRequests).toBe(requests.length);
    expect(dashboard.recentRequests.length).toBeGreaterThan(0);
    expect(creatorMock.listMyPackages().length).toBeGreaterThan(0);
  });

  it('hides a brand that keeps its name private until the deal is paid', () => {
    mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);
    const hidden = creatorMock.getDashboard().recentRequests.find((d) => d.brandProfile?.companyName === null);
    expect(hidden).toBeDefined();
  });

  it('signs in to a finished brand account', () => {
    const { user } = mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
    expect(user.accountType).toBe('brand');
    const dashboard = brandMock.getDashboard();
    expect(dashboard.profile.companyName).toBeTruthy();
    expect(dashboard.stats.pendingApprovals).toBeGreaterThan(0);
  });

  it('rejects a demo email with the wrong password', () => {
    expect(() => mockLogin(DEMO_ACCOUNTS.brand.email, 'nope')).toThrow(/demo1234/);
  });

  it('signs a new email up as an empty account that onboards into an empty profile', () => {
    const { user } = mockLogin('someone@example.com', 'whatever1');
    expect(user.accountType).toBeNull();
    expect(session.userId).toBe(user.id);

    mockCompleteOnboarding({
      accountType: 'brand',
      displayName: 'Someone Ltd',
      bankAccount: { accountHolderName: 'S', accountNumber: '123456789', ifscCode: 'HDFC0000001', bankName: 'HDFC' },
    });
    const dashboard = brandMock.getDashboard();
    expect(dashboard.stats).toEqual({ totalSpent: '0.00', activeCollabs: 0, pendingApprovals: 0, openCampaigns: 0 });
    expect(dashboard.recentCollabs).toEqual([]);
  });

  it('keeps an account between sign-ins', () => {
    const first = mockLogin('again@example.com', 'pass1234');
    const second = mockLogin('again@example.com', 'pass1234');
    expect(second.user.id).toBe(first.user.id);
  });
});
