/** Query keys shared across screens, so an invalidation in one place reaches every reader. */
export const CREATOR_DASHBOARD_QUERY_KEY = ['creator', 'dashboard'] as const;
export const CREATOR_PACKAGES_QUERY_KEY = ['creator', 'packages'] as const;
export const CREATOR_PROFILE_QUERY_KEY = ['creator', 'profile'] as const;
export const CREATOR_STATS_QUERY_KEY = ['creator', 'stats-submission'] as const;
export const BRAND_DASHBOARD_QUERY_KEY = ['brand', 'dashboard'] as const;
export const BRAND_PROFILE_QUERY_KEY = ['brand', 'profile'] as const;

/** Every collab query starts with this, so one invalidation refreshes lists and details. */
export const COLLABS_QUERY_KEY = ['collabs'] as const;
export const collabListKey = () => ['collabs', 'list'] as const;
export const collabDetailKey = (id: string) => ['collabs', 'detail', id] as const;
export const collabFeesKey = (id: string) => ['collabs', 'fees', id] as const;
export const collabDraftsKey = (id: string) => ['collabs', 'drafts', id] as const;
export const collabReviewsKey = (id: string) => ['collabs', 'reviews', id] as const;
export const collabReportsKey = (id: string) => ['collabs', 'reports', id] as const;

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const MESSAGES_QUERY_KEY = ['messages'] as const;
export const WALLET_QUERY_KEY = ['wallet'] as const;
export const CAMPAIGNS_QUERY_KEY = ['campaigns'] as const;
export const DISCOVERY_QUERY_KEY = ['discovery'] as const;
