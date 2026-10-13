/** Query keys shared across screens, so an invalidation in one place reaches every reader. */
export const CREATOR_DASHBOARD_QUERY_KEY = ['creator', 'dashboard'] as const;
export const CREATOR_PACKAGES_QUERY_KEY = ['creator', 'packages'] as const;
export const CREATOR_PROFILE_QUERY_KEY = ['creator', 'profile'] as const;
export const BRAND_DASHBOARD_QUERY_KEY = ['brand', 'dashboard'] as const;
export const BRAND_PROFILE_QUERY_KEY = ['brand', 'profile'] as const;
