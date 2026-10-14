# FindCollab — Sprint Plan & Progress Tracker

Shipped under the name **FindCollab** (user's branding choice, 2026-10-12) — `prompt.md`'s own
internal spec text still calls the product "InfluenceHub" throughout since it's the original,
unmodified spec document; that's a naming difference only; no behavior changes.

Living document derived from `prompt.md` (the full frontend build spec). Each sprint is scoped to
ship a coherent, demoable slice of the app in build-dependency order (foundation → auth →
core roles → the collab/escrow lifecycle → messaging → money → campaigns → polish/hardening),
matching `prompt.md` §7's flow order rather than its §6 reading order.

**Goal of this app:** a production-grade, professional, trustworthy fintech-meets-creator-economy
mobile app — not a prototype. Every sprint's Definition of Done includes loading/empty/error states,
accessibility basics, and no hardcoded/mocked data left behind, not just "the happy path renders."

## How to use this document

- Work sprints roughly in order — later sprints assume components/screens from earlier ones exist.
- Before starting a sprint, re-read the referenced `prompt.md` section(s) — this doc summarizes,
  it doesn't replace the spec.
- While working a sprint: flip its status marker, and when a sprint is finished (or meaningfully
  advanced, or blocked), append a dated entry to its **Progress Log** — a few lines is enough:
  what shipped, what was deferred, any deviation from spec and why. Do this *every time* progress
  is made, not just at sprint close.
- Status markers: `⬜ Not Started` · `🔄 In Progress` · `✅ Done` · `⏸ Blocked`.
- Keep the summary table below in sync with each sprint's status marker so progress is visible at
  a glance without opening every section.
- If a sprint's scope turns out to be wrong once you're in it (spec ambiguity, missing backend
  field, etc.), note it in that sprint's Progress Log rather than silently changing behavior —
  future sessions (and the user) need to know where the build intentionally diverged from spec.

---

## Where things stand (2026-10-14)

**Done against the mock server** (every screen below has its real endpoint wired beside the mock;
none of it has been run against the backend or on a device yet):
- Auth, intro slides, onboarding (role, bank, How It Works), 7-step creator wizard, company profile.
- Creator: Home dashboard, profile screen with the 7 steps as editable rows, packages, stats
  submission, preview as brands see it, incoming requests, Campaigns (open campaigns, apply,
  my applications), Wallet + payout accounts.
- Brand: Home dashboard with "Needs your attention", Account screen, Discover with filters, creator
  profile, saved lists, send request, Campaigns (create both types, tracker, invite, applications),
  Billing, Analytics.
- Both: Collabs list + Collab Detail for the whole lifecycle (accept/decline/counter-offer, pay,
  drafts, submit post, verify, dispute, reviews, 7/30-day reports), Inbox + chat, Notifications,
  Settings, Change Password.
- Two demo accounts on Login (`creator@demo.findcollab.app` / `brand@demo.findcollab.app`,
  password `demo1234`) sharing one seeded dataset; "Reset demo data" restores it.
- Checks at this point: typecheck clean, 70/70 tests, lint 0 errors, Android export bundles.

**Remaining**
1. **API binding (next phase):** run every screen with `EXPO_PUBLIC_MOCK_API=false` against
   `influencer_backend`, fix any shape mismatches, reconcile the still-PROVISIONAL
   `lib/auth/types.ts` / `lib/api/auth.ts` and NICHES/LANGUAGES lists, verify silent refresh
   (0.3), then delete `src/lib/api/mock/`, `mock-mode.ts`, every `IS_MOCK_API` branch, the Login
   demo panel and the Demo settings group.
2. **Device testing** of every screen (iOS + Android) — none done yet, including keyboard
   behaviour in chat and forms, and the Role Selection rendering question from 2026-10-13.
3. **4.3 Razorpay checkout** — `react-native-razorpay` + dev build; create-order → checkout →
   lock-escrow, with failure/cancel handling.
4. **8.1 Push notifications and OS deep links** — expo-notifications, token registration, routing
   from `metadata.dealId`.
5. **Smaller gaps:** per-photo upload retry (1.3), stronger nudge for a skipped step 7 (1.3),
   package delete (2.2, backend only deactivates), price-guidance hint and inclusions in the
   package form, campaign editing (7.1), video/PDF chat attachments (5.1), video draft preview,
   brand logo upload (no backend endpoint), Support/Legal links in Settings (need URLs),
   component gallery (0.2), reduced FilterSheet reuse on creator Campaigns (3.1).
6. **8.3 Creator Tools Hub** (optional) and **9.1 / 9.2** hardening, accessibility audit,
   analytics events, release prep — not started.

---

## Progress Overview

| # | Sprint | Status |
|---|---|---|
| 0.1 | Project Scaffold & Tooling | ✅ Done |
| 0.2 | Design System & Core UI Primitives | 🔄 In Progress |
| 0.3 | App Infrastructure (API client, auth store, nav shell) | 🔄 In Progress |
| 1.1 | Pre-Auth Flow | ✅ Done |
| 1.2 | Onboarding Core (Role, Bank, How It Works) | ✅ Done |
| 1.3 | Creator Profile Setup Wizard | ✅ Done |
| 1.4 | Brand Profile Setup & Completeness Banners | ✅ Done |
| 1.5 | Brand Home & Tab Shell (added 2026-10-13) | ✅ Done |
| 2.1 | Creator Dashboard & Edit Profile | ✅ Done |
| 2.2 | Creator Packages | ✅ Done |
| 2.3 | Incoming Requests & Stats Submission | ✅ Done |
| 3.1 | Discover Creators & Filter Sheet | ✅ Done |
| 3.2 | Creator Profile Detail (Brand View) & Saved Lists | ✅ Done |
| 3.3 | Send Collab Request | ✅ Done |
| 4.1 | My Collabs List Shell | ✅ Done |
| 4.2 | Collab Detail Core & Status Stepper | ✅ Done |
| 4.3 | Payments — Razorpay Escrow Checkout | 🔄 In Progress |
| 4.4 | Draft Approval Flow | ✅ Done |
| 4.5 | Submit Post, Verify & Dispute | ✅ Done |
| 4.6 | Review & Rating, Performance Reports | ✅ Done |
| 5.1 | Messaging (Conversations & Chat Thread) | ✅ Done |
| 6.1 | Creator Wallet & Payout Accounts | ✅ Done |
| 6.2 | Brand Billing & Analytics | ✅ Done |
| 7.1 | Campaigns List & Create Campaign | ✅ Done |
| 7.2 | Campaign Tracker — Brand-Invite Path | ✅ Done |
| 7.3 | Campaign Tracker — Open Application Path | ✅ Done |
| 7.4 | Creator Side — Discover & Apply to Campaigns | ✅ Done |
| 8.1 | Notifications & Deep Linking | 🔄 In Progress |
| 8.2 | Settings | ✅ Done |
| 8.3 | Creator Tools Hub (bonus, low priority) | ⬜ Not Started |
| 9.1 | Non-Functional Hardening (offline, a11y, perf) | ⬜ Not Started |
| 9.2 | Analytics Instrumentation & Release Prep | ⬜ Not Started |

> **As of 2026-10-14, "✅ Done" from 1.4 onward means done against the mock server** (`src/lib/api/mock/`):
> every screen calls the real endpoint when `EXPO_PUBLIC_MOCK_API=false`, but none of it has been
> exercised against the backend or on a device yet. API binding is the next phase.

---

## Phase 0 — Foundation

### 0.1 Project Scaffold & Tooling
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §2

**Scope**
- Initialize Expo + TypeScript project with Expo Router.
- Install and wire: NativeWind v4, TanStack Query, Zustand, react-hook-form + zod, axios,
  expo-secure-store, expo-image(+picker+manipulator), expo-notifications, @gorhom/bottom-sheet,
  react-native-gifted-charts, lucide-react-native, react-native-toast-message, moti +
  react-native-reanimated, dayjs.
- Set up folder structure exactly per §2's suggested layout (`app/`, `components/ui`,
  `components/domain`, `lib/api`, `lib/auth`, `lib/validation`, `lib/theme.ts`, `hooks/`).
- ESLint + Prettier + TypeScript strict mode; a test runner (Jest + React Native Testing Library).
- Configurable API base URL via Expo env config (dev/staging/prod), per §10.

**Definition of Done**
- [x] App boots on iOS + Android (simulator/emulator) and Expo Go with a blank placeholder screen.
- [x] `npm run lint`, `npm run typecheck`, `npm test` all pass on a clean checkout.
- [x] Env-based API base URL confirmed switchable without code changes.

**Progress Log**
- 2026-09-16: Scaffolded via `create-expo-app@latest` (Expo SDK 57, React 19.2, RN 0.86, New
  Architecture, React Compiler). Adopted the template's `src/app` file-based-routing convention
  (not a root-level `app/`) — CLAUDE.md updated to match. Installed the full dependency list from
  §2 (NativeWind v4 + Tailwind v3.4, TanStack Query, Zustand, react-hook-form+zod, axios,
  expo-secure-store, expo-image-picker/manipulator, expo-notifications, @gorhom/bottom-sheet,
  react-native-gifted-charts, lucide-react-native, react-native-toast-message, moti, dayjs) plus
  @expo-google-fonts/{inter,manrope}, @react-native-community/datetimepicker,
  @react-native-async-storage/async-storage, clsx + tailwind-merge. `react-native-razorpay` is
  intentionally *not* installed yet — deferred to Sprint 4.3 (Payments), since it needs a native
  dev build regardless of when it's added.
- 2026-09-16: ESLint (flat config, eslint-config-expo + eslint-config-prettier), Prettier
  (+ prettier-plugin-tailwindcss), Jest (jest-expo preset) all configured and passing —
  `npm run lint` / `npm run typecheck` / `npm test` all green. Verified the real bundle compiles
  via `expo export --platform android` (3998 modules, Hermes bytecode). `expo export --platform
  web` (static SSR) throws inside expo-secure-store's web shim under Node prerendering — left
  unfixed since web isn't a target platform per §2; use the android/ios export to sanity-check
  bundling instead.
- API base URL wired via `EXPO_PUBLIC_API_BASE_URL` env var, falling back to `app.json`'s
  `expo.extra.apiBaseUrl`, falling back to `http://localhost:3000` (`src/lib/api/client.ts`).

---

### 0.2 Design System & Core UI Primitives
**Status:** 🔄 In Progress
**Spec refs:** prompt.md §3 (all subsections), §8

**Scope**
- `theme.ts`: full light/dark color token set (§3.1), type scale + Manrope/Inter via `expo-font`
  (§3.2), spacing/radius/elevation scale (§3.3). System-theme default with manual override wired
  later in Settings (8.2).
- Core primitives in `components/ui/`: Button, Input/TextArea, Select/MultiSelect (bottom-sheet
  + search), Chip/Tag, Badge (TrustBadge, StatusBadge, FollowerRangeBadge), Avatar, Card,
  EmptyState, Skeleton (list-row/card-grid/detail-page variants), BottomSheet wrappers
  (FilterSheet, ActionSheet, ConfirmSheet), Toast, StatusStepper (horizontal + vertical),
  CountdownChip, MoneyText.
- These are the only building blocks every later sprint should reuse — no ad hoc styling once
  this sprint is done.

**Definition of Done**
- [ ] Every component in §3.4's table exists, typed, themed for light+dark, with the variants
      listed in the spec (not just a default state). — **Open:** Light theme complete; dark tokens exist but the app is pinned light, so the dark variants are unpolished.
- [x] Currency renders via `MoneyText` with tabular-nums alignment. *(tabular digits added 2026-10-14)*
- [ ] A component gallery/dev screen (throwaway, not shipped) exists to visually QA all primitives
      together before building real screens on top of them. — **Open:** Not built.

**Progress Log**
- 2026-09-16: `src/lib/theme.ts` (Colors light/dark, Spacing, Radius, Typography, TrustScoreMeta)
  built and mirrored into `src/global.css`'s CSS variables + `tailwind.config.js`'s color/font/size
  scale (dark mode via NativeWind's class strategy, see `use-app-theme.ts`). Manrope/Inter loaded
  via `@expo-google-fonts/*` in the root layout.
- 2026-09-16: Built and needed for Phase 1.1, so built first: `Text`, `Screen`, `Button` (all 4
  variants incl. width-stable loading state), `Input` (label/error/counter/leading-icon/password
  toggle, doubles as TextArea via `multiline`), `Card`/`PressableCard`, `Chip` (static +
  selectable + removable), `Avatar` (photo + deterministic-color initials fallback +
  availability ring), `Badge` module (`StatusBadge` generic, `TrustBadge`, `FollowerRangeBadge`),
  `EmptyState`, `Skeleton` (block + list-row/card-grid/detail-page presets), `AppBottomSheet` +
  `useConfirmSheet()`, `toast-config.tsx` + `lib/toast.ts`, plus two auth-specific pieces
  (`PasswordChecklist`, `GoogleIcon`).
  - **Deliberately deferred, not forgotten**: `Select`/`MultiSelect` (needed first in Sprint 1.3
    for state/niches/languages), `FilterSheet`/`ActionSheet` (first needed in 3.1), `StatusStepper`
    and `CountdownChip` (first needed in 4.1/4.2 once the real deal-status enum exists),
    `MoneyText` (first needed in 2.1), and every domain card (`PackageCard`, `DealCard`,
    `CampaignCard`, `CreatorCard`, `TransactionRow` — each needs its phase's real data shape to
    build against honestly rather than against a guessed shape). Building these now against
    placeholder data would mean rebuilding them anyway once the real screens land — add each when
    its sprint starts, and flip this sprint to Done once the last one lands.
  - `StatusBadge` is intentionally generic (`tone` + `label` props) — the deal-status→tone lookup
    table promised by §6.3 as "one source of truth object" belongs in Sprint 4.2 once the actual
    `DealStatus` enum is confirmed, not guessed here.
  - No component gallery screen yet — will add once Select/MultiSelect exists, so it's worth a
    dedicated QA pass rather than two.
- **2026-10-13** — Design-system pass, batch 1 (tokens + shared primitives only; screens follow in
  later batches). Fixed two silent defects: tailwind-merge was dropping every custom font-size
  class (`lib/cn.ts`), and `Text`'s `weight` prop was swapping headings from Manrope to Inter.
  Added the `action`/`inverse` color tokens (ink-led primary buttons, violet kept as accent),
  AA-contrast `muted`/`danger`/`positive`, dark-mode trust colors, a full px spacing scale,
  `rounded-hero`, `lib/motion.ts`, and `ScreenHeader`. Reworked `OtpInput` (single field, paste +
  SMS autofill), `AppBottomSheet` (`scrollable` mode, safe-area padding, Android back), `Avatar`,
  `Select`, `DateField`. Details in CLAUDE.md's "Design-system pass, batch 1". Checks: typecheck
  clean, lint 0 errors, 22/22 tests, `expo export --platform android` bundles. **Not yet verified
  on a device.**
- **2026-10-13** — Editorial redesign (user rejected the violet-led look). New palette (ivory /
  charcoal / stone, muted-sage accent, dedicated warm-charcoal dark mode); `brand` color token
  renamed to `accent` and violet removed from the UI entirely; `HeroOrb` deleted; new
  `IconBadge`; radii tightened to 8/12/20. All Phase 1 screens restyled to the same system
  (Splash, Welcome, Login, Forgot/Reset Password, Role Selection, Bank Setup, How It Works,
  Creator Wizard + steps, Brand Profile Setup, Coming Soon). First-launch flow: Welcome rebuilt
  (Skip / Next / Get Started, swipe, pagination, Android Back steps back a slide); splash no
  longer waits a fixed 1.5s; launch routing extracted to `lib/auth/initial-route.ts` with 13 unit
  tests; intro flag key bumped to `.v2`. Creator Wizard: Android Back steps back one step, each
  step opens scrolled to top. Checks: typecheck clean, lint 0 errors, 35/35 tests, Android export
  bundles. **Not yet verified on a device or emulator.**
- **2026-10-13** — Light-theme refinement (user found the neutral pass still dark and
  unfinished). App pinned to light regardless of device dark mode (`APP_COLOR_SCHEME`,
  `colorScheme.set` in `_layout.tsx`, `userInterfaceStyle: "light"`). Palette lightened
  (`#FAF9F6` / `#FFFFFF` / `#202020` / `#706F69` / `#E8E5DF`, sage `#667B62` + `accent-strong`
  for text). Selected chips/segments/cards moved from black fills to a light-sage surface with a
  sage border; progress bars sage; disabled primary button is a stone fill. Type scale raised
  (h1 28, body 16); inputs and large buttons 52pt; default 24pt gutter in `Screen`. Welcome
  slides gained product vignettes (`components/domain/intro/IntroVignettes.tsx`). Role Selection
  rebuilt as full-width rows with Continue pinned to the bottom. All screen/step entrance
  animations removed (possible cause of the reported late-appearing role cards — not confirmed).
  Checks: typecheck clean, lint 0 errors, 35/35 tests, Android export bundles. **Not verified on
  a device or emulator.**
- 2026-10-14: `MoneyText` now uses tabular digits. New shared primitives: `ListGroup`/`ListRow`, `CountdownChip`, `MonthlyBarChart`. Still open: component gallery, dark-variant polish.

---

### 0.3 App Infrastructure
**Status:** 🔄 In Progress
**Spec refs:** prompt.md §2, §4 (root gate logic), §5

**Scope**
- Axios instance (`lib/api/`) with request interceptor (bearer token) and response interceptor
  (401 → silent `/auth/refresh` → replay once → force logout + redirect to Login on second
  failure). One file per backend resource, matching `frontend_prompt.md`'s endpoint groups
  (ask the user for this file if not yet available — do not invent endpoints/shapes).
- `useAuthStore` (Zustand) persisted via `expo-secure-store`: tokens, current user, accountType,
  onboarding status.
- React Query client setup: global defaults for retry/staleTime, refetch-on-focus policy per §5.
- Root layout (`app/_layout.tsx`) implementing the 4-step gate logic from §4.
- Global error handling: axios error interceptor → toast mapping per §5; a top-level error
  boundary so a render crash never shows a blank/frozen screen.

**Definition of Done**
- [x] Root gate correctly routes an unauthenticated user to `(auth)`. *(mid-onboarding /
      fully-onboarded routing can't be real yet — those stacks don't exist until 1.2/Phase 2-3;
      both currently land on the temporary `/coming-soon` screen, called out at each call site.)*
- [ ] Silent refresh + forced logout on double-401 — implemented, not yet verified against a real
      backend (none available in this repo). — **Open:** Needs the real backend (API binding phase).
- [x] A thrown error in a screen shows the app's error boundary, never a blank screen.

**Progress Log**
- 2026-09-16: `src/lib/api/client.ts` — axios instance, bearer-token request interceptor,
  response interceptor with coalesced silent-refresh-on-401 (concurrent 401s share one refresh
  call), forced logout + toast on refresh failure, and a global error→toast mapping that a screen
  can opt out of per-request via `skipGlobalErrorToast` (for screens mapping 422/400 onto form
  fields themselves, per §5). `src/lib/auth/store.ts` — Zustand store persisted through
  `expo-secure-store` (custom `StateStorage` adapter in `secure-storage.ts`), tracks
  `isHydrating` so the root layout can hold the splash screen until rehydration finishes.
  `src/lib/query-client.ts` — QueryClient with sane defaults (`refetchOnWindowFocus` off by
  default; per prompt.md §5, money/status queries should opt in per-query, not globally).
- 2026-09-16: Root layout (`src/app/_layout.tsx`) wires
  GestureHandlerRootView → SafeAreaProvider → QueryClientProvider → BottomSheetModalProvider,
  loads fonts, and holds the native splash screen until fonts + auth-store hydration are both
  ready. `src/app/index.tsx` is the in-app Splash (§6.1): attempts silent refresh if a refresh
  token is persisted, caps at 1.5s, then routes. `src/components/ErrorBoundary.tsx` (class
  component, required for React error boundaries) wraps the whole provider tree and shows a
  "Try Again" recovery screen instead of a blank frame on a render crash.
- Remaining before this sprint is fully Done: verify silent-refresh/forced-logout against a real
  or mocked backend once one is available, and extend the gate's steps 2–4 once 1.2/Phase 2-3 land.

---

## Phase 1 — Auth & Onboarding

### 1.1 Pre-Auth Flow
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.1

**Scope:** Splash (silent refresh attempt, 1.5s max), Welcome Carousel (first-run only, 3 slides,
AsyncStorage flag), Login (email/password + Google via `expo-web-browser` redirect intercept),
Forgot Password (anti-enumeration copy), Reset Password (deep link, no auto-login on success).

**Definition of Done**
- [x] New-user and returning-user login both work through the same form (no separate signup UI).
- [x] Google OAuth round-trip implemented (expo-web-browser + Linking redirect parsing) — **not
      verified against a real backend**, see Progress Log.
- [x] Reset-password deep link (`influencehub://reset-password?token=...`) opens the right screen
      (`app.json` scheme is `influencehub`; route resolves via `(auth)/reset-password.tsx`, which
      maps to path `/reset-password` since the group segment doesn't appear in the URL).
- [x] Password validation checklist matches backend rule (8+ chars, 1 digit) — shared between
      Login (informational only) and Reset Password (enforced) via `passwordChecklist` in
      `lib/validation/auth.ts`.

**Progress Log**
- 2026-09-16: Built all five screens — `index.tsx` (Splash), `(auth)/welcome.tsx`,
  `(auth)/login.tsx`, `(auth)/forgot-password.tsx`, `(auth)/reset-password.tsx` — plus a temporary
  `/coming-soon` landing for the two "where do I go after this" spots that don't have a real
  destination yet (see the "Root navigation gate logic" note in CLAUDE.md). Forgot Password always
  shows the same success copy regardless of whether the email exists, per the anti-enumeration
  requirement. Reset Password shows a distinct "link expired" state when no `token` param is
  present rather than rendering a broken form.
- **Assumptions flagged for reconciliation against `frontend_prompt.md`** (see also SPRINTS.md's
  "Deviations from Spec" at the bottom): the `AuthUser`/`AuthSession` shapes in
  `src/lib/auth/types.ts`, and the Google OAuth contract (`GET /auth/google/url` → open via
  `expo-web-browser.openAuthSessionAsync` → parse `?code=` from the redirect → `POST
  /auth/google/callback`). The redirect URI passed to `openAuthSessionAsync` is generated by
  `Linking.createURL('google-callback')`; whether the backend's OAuth config needs to be told this
  exact URI (vs. using its own fixed callback) is unconfirmed — verify once real credentials exist.
- Not yet exercised end-to-end against any backend (none available in this repo) — the mutations,
  loading/error states, and toasts are wired and typecheck/lint/build clean, but only manually
  reasoned through, not run against live responses.

---

### 1.2 Onboarding Core
**Status:** ✅ Done
**Spec refs:** prompt.md §6.2 (Role Selection, Bank & Payout Setup, How It Works)

**Scope:** Role Selection (permanence warning copy, displayName field), Bank & Payout Setup
(account holder/number/confirm with paste-blocked confirm field, IFSC live-validated +
auto-uppercase, optional UPI section, single `complete-onboarding` call with recoverable 422
handling), How It Works (role-specific, one-time).

**Definition of Done**
- [x] `complete-onboarding` failure (e.g. bad IFSC) surfaces inline field errors without losing
      entered data (`applyServerFieldErrors` maps `errors[]` onto the form via `setError`; request
      opts out of the global error toast via `skipGlobalErrorToast` so it's not shown twice).
- [x] Success routes Brand → Discover tab directly; Creator → Profile Setup Wizard entry with a
      working `Skip for now`. *(Both currently land on `/coming-soon` since the Discover tab
      (3.1) and Wizard (1.3) don't exist yet — each `finish('/coming-soon')` call site in
      `how-it-works.tsx` is commented with which sprint replaces it.)*
- [x] Role choice cannot be changed after this step from anywhere in the app — there is no
      settings/profile screen yet that could offer this, and none of §6 ever revisits accountType.

**Progress Log**
- 2026-09-22: Built `(onboarding)/role-selection.tsx` (two-card selector, revealed displayName
  field, permanence warning as quiet inline text not a modal, per spec), `(onboarding)/bank-setup.tsx`
  (explain-first banner; Confirm Account Number uses `contextMenuHidden` to block paste — the
  standard RN mitigation, though not airtight against every OS's clipboard-suggestion UI, noted
  inline; IFSC auto-uppercases and, once it matches the full format regex, debounce-looks-up the
  bank name via Razorpay's free public IFSC API (`lib/api/ifsc.ts`) without ever clobbering a
  manually-typed Bank Name; collapsible UPI section), `(onboarding)/how-it-works.tsx` (Brand:
  3-step explainer; Creator: welcome + "Set Up My Profile" / "Skip for now").
- Added `(onboarding)/_layout.tsx` guard (redirects to `/login` if no session) and
  `lib/auth/onboarding-draft-store.ts` — an in-memory-only Zustand store handing `{accountType,
  displayName}` from Role Selection to Bank Setup (the actual `complete-onboarding` call happens
  once, at the end of Bank Setup, bundling both with the bank details, exactly as §6.2 specifies).
  Not persisted on purpose: an app kill mid-onboarding just means re-picking the role, which is
  cheap and avoids stale partial state surviving a restart.
- Extracted `lib/auth/route-after-auth.ts` (`getPostAuthRoute`, async) as the single source of
  truth for post-auth routing, replacing the duplicated branching that used to live in both
  `index.tsx` and `login.tsx`'s `routeAfterAuth`. It also checks a new local flag
  (`hasSeenHowItWorks` in `lib/local-flags.ts`, same AsyncStorage pattern as the welcome carousel)
  so a returning user who finished onboarding but hasn't seen How It Works yet still lands there.
- Added `lib/form-errors.ts` (`applyServerFieldErrors`) as a reusable helper for the
  422/400-onto-form-fields pattern prompt.md §5 describes — every future form should use this
  rather than re-implementing the `errors[]` → `setError` mapping per screen.
- **Assumption flagged**: prompt.md doesn't specify how "How It Works is one-time" is tracked
  client-side; implemented as a device-local AsyncStorage flag (mirrors the welcome-carousel
  pattern) rather than a backend field, since none is mentioned. Revisit if `frontend_prompt.md`
  turns out to have a real `hasSeenOnboarding`-type field.
- Not exercised against a real backend (none available) — typecheck/lint/test/bundle-export all
  clean; the IFSC lookup does hit a real external API (Razorpay's public endpoint) and is wrapped
  to fail silently if unreachable.

---

### 1.3 Creator Profile Setup Wizard
**Status:** ✅ Done
**Spec refs:** prompt.md §6.2 (wizard table, steps 1–7)

**Scope:** 7-step wizard (Identity, Location, Languages & Niches, Social Accounts, Photos, Phone
Verification, First Package), each step calling its own endpoint (not a batched final submit) so
progress persists if the user leaves mid-flow. Success screen → Creator Home. Profile-completeness
banner (computed client-side from `GET /creators/me` field presence).

**Definition of Done**
- [x] Leaving the wizard after step 3 and returning resumes at step 3, not step 1 — holds within a
      running app session (wizard state lives in a Zustand store, not component state, so
      navigating away and back doesn't reset it). Does **not** survive an app kill/restart — see
      Deviations; real resume needs `GET /creators/me` field presence against a live backend.
- [x] Niche multi-select hard-caps at 5 with correct counter/disabled-state UX
      (`MultiSelectField`'s `max` prop, reused generically — also ready for any other
      hard-capped multi-select later).
- [ ] Photo upload supports per-image retry without restarting the whole step. — **Open:** Not
      built; the mock upload can't fail. Add per-image retry during API binding, when uploads can.
- [x] OTP flow has working resend cooldown (30s), plus the dev-only `888999` mock-mode hint
      prompt.md §6.2 itself mentions.
- [ ] Skipping step 7 produces a stronger nudge on Home than skipping earlier steps. — **Open:**
      Not built. Home's "Finish profile" banner and the profile screen treat step 7 like the
      other steps (the Packages row does say brands can't book you without one).

**Progress Log**
- 2026-09-30: Built the wizard shell (`(onboarding)/creator-wizard.tsx`) plus all 7 step
  components under `components/domain/creator-wizard/` (Step1Identity…Step7FirstPackage), each
  owning its own react-hook-form + zod schema + mutation, matching the spec's "call the relevant
  PUT/POST per step" instruction. Shared state lives in `lib/auth/creator-wizard-store.ts`
  (in-memory, not persisted — see Deviations).
- New reusable UI primitives this sprint needed and that other sprints will reuse:
  `SelectField`/`MultiSelectField` (`components/ui/Select.tsx`, bottom-sheet + search, chips for
  multi), `SegmentedControl` (gender, content type), `DateField` (native date picker wrapper,
  16+ enforced via `maximumDate`), `OtpInput` (6-box auto-advance/auto-back), `StepProgress`
  (top progress bar). `lib/constants.ts` added the shared NICHES/LANGUAGES/INDIAN_STATES/
  CONTENT_TYPES lists the spec says to share with the Discover filter sheet (3.1).
  Profile photo crop-to-400×400 uses `expo-image-picker`'s built-in 1:1 crop UI followed by
  `expo-image-manipulator`'s resize, so the final asset is always exactly 400×400 regardless of
  what the OS crop UI itself produces.
- `lib/api/creator.ts` added (`updateCreatorProfile`, `uploadProfilePhoto`, `uploadCoverPhotos`,
  `createPackage`), all branching through the new mock-mode layer (see CLAUDE.md's "Mock mode").
- **Assumptions flagged** (provisional, pending `frontend_prompt.md`): the exact
  `CreatorProfileUpdate` field names/enums, and the 20-niche/12-language lists in `lib/constants.ts`
  — prompt.md says to hardcode "the BRD's" sets but doesn't enumerate them, so these are a
  reasonable India-market stand-in, not the verified BRD list.
- Not exercised against a real backend or a real device/simulator (none available in this
  environment — see the note on this at the end of Phase 1's work). Typecheck/lint/test/Android
  bundle export all clean.
- 2026-10-13: Step 7 now takes multiple packages of any content type (was a single "first
  package"). Each save is one existing `POST /creators/me/packages` call; saved packages are
  listed in the step (`packages` in `creator-wizard-store.ts`) with "Add Another Package" /
  "Finish". No edit or delete in the wizard — no such endpoint exists in `lib/api/creator.ts`.

---

### 1.4 Brand Profile Setup & Completeness Banners
**Status:** ✅ Done
**Spec refs:** prompt.md §6.2 (Brand Profile Setup)

**Scope:** Brand Company Info screen (reachable from Settings, not force-shown), lighter-touch
completeness nudge on Brand Home.

**Definition of Done**
- [x] Brand can fully use the app having only completed mandatory onboarding (this screen is
      genuinely optional, not soft-blocking anything) — Brand's How It Works → "Start Discovering"
      never routes through this screen.
- [x] Lighter-touch completeness nudge on Brand Home — **not built**, Brand Home doesn't exist
      until Phase 3 (3.x). Nothing to nudge from yet.

**Progress Log**
- 2026-09-30: Built `brand-profile-setup.tsx` (company name, website, industry — reused the niche
  list as the spec directs, description with 150-char counter, logo picker, phone, optional GSTIN,
  and the "Show brand name in collabs" toggle pulled forward from §6.5's Edit Brand Profile since
  it's the same form). `lib/api/brand.ts` (`updateBrandProfile`, `uploadBrandLogo`, both mocked).
  Since Settings (8.2) — this screen's real, permanent entry point — doesn't exist yet, it's
  temporarily reachable from `/coming-soon` for Brand accounts only; that entry point is commented
  as temporary and should move once Settings ships.
- Leaving this sprint **In Progress** rather than Done: the completeness-nudge half of its scope
  needs Brand Home to exist (Phase 3). Will close out once that nudge is added there.
- 2026-10-14: Brand Home header opens an Account screen (`brand/account.tsx`) with Company profile, Billing, Analytics, Saved lists, Settings and Log out. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 1.5 Brand Home & Tab Shell
**Status:** ✅ Done
**Spec refs:** prompt.md §4 (brand tab group), §6.5 (Brand Dashboard), §6.2 (Brand Profile Setup)

Added so a brand has somewhere real to land after onboarding (the original plan left this to
Phase 3 and parked brands on a placeholder screen).

**Progress Log**
- 2026-10-13: Brand area under a real `brand/` segment: `_layout.tsx` (session + role guard),
  `(tabs)/` with Home, Discover, Collabs, Campaigns, Inbox. Only Home is built; the other four
  render `NotBuiltYetTab`. `getPostAuthRoute` sends an onboarded brand to `/brand/home`, and How
  It Works' button now reads "Go to Dashboard". `coming-soon.tsx` is deleted — nothing routes to
  it any more; its Log Out and dev-only "Replay intro" moved to `AccountFooter` on both Homes.
- Brand Home (`brand/(tabs)/home.tsx`) reads `GET /brands/me/dashboard` in the backend's real
  shape: four stat tiles (total spent, active collabs, posts to review, active campaigns),
  Collabs in progress, Your campaigns, a "set up profile" nudge while `companyName` is empty,
  pull-to-refresh, refetch on focus, skeleton / error / empty states. Shares
  `components/domain/dashboard/DashboardParts.tsx` with Creator Home.
- Company profile moved from `brand-profile-setup.tsx` to `brand/profile.tsx` and now loads
  `GET /brands/me`, so it works as an edit screen. Contract fixes: the website field was sent
  as `website` (backend: `brandWebsite`), and a blank website was sent as `""`, which the
  backend rejects.
- **Not built:** Discover, Collabs, Campaigns, Inbox, Saved Lists, Billing, Analytics. Collab
  and campaign rows on Home are not tappable (their detail screens don't exist).
- Mock mode shows a new brand account: nothing spent, no collabs, no campaigns.
- 2026-10-14: **Demo accounts for mock mode** (user request: "have two demo account logins one
  for brand and another for creator… use only mock data"). `lib/api/mock-demo-data.ts` defines
  `creator@demo.findcollab.app` / `brand@demo.findcollab.app` (password `demo1234`), offered as
  two buttons on Login when `IS_MOCK_API`. Both skip onboarding and How It Works and land on
  Home with made-up profile, packages, requests, collabs and campaigns. Any other email is still
  a new, empty account. Covered by `lib/api/__tests__/mock-accounts.test.ts`. Checks: typecheck
  clean, lint 0 errors, 46/46 tests, Android export bundles. Not run on a device.
- Checks: typecheck clean, lint 0 errors, 41/41 tests, Android export bundles. **Not run on a
  device or against the real backend.**
- 2026-10-14: All five brand tabs are real screens now (Home, Discover, Collabs, Campaigns, Inbox). Home gained "Needs your attention" (posts to verify, collabs to pay), tappable rows, quick actions and a notifications bell. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 2 — Creator Core

### 2.1 Creator Dashboard & Edit Profile
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Creator Dashboard, Edit Creator Profile)

**Scope:** Home layout (availability toggle, completeness banner, stat row incl. tappable Trust
Score explainer sheet, Incoming Requests carousel, Active Collabs preview, Recommended Campaigns
preview). Edit Profile as single-screen sectioned form with a public preview mode.

**Definition of Done**
- [x] Availability toggle is an instant-save switch, no separate save step.
- [x] Preview-as-brands-see-it opens the real Creator Profile Detail screen read-only (reused
      from 3.2, not a duplicate screen).

**Progress Log**
- 2026-10-13: Creator area scaffolded under a real `creator/` path segment
  (`src/app/creator/_layout.tsx` guard + `(tabs)/` with Home, Discover, Collabs, Wallet, Inbox).
  Only Home is built; the other four tabs render `NotBuiltYetTab`, which says so and shows no
  sample content. `getPostAuthRoute` now sends an onboarded creator to `/creator/home` (brands
  still go to `/coming-soon`); the wizard's finish and How It Works' "Skip for now" go there too.
- Home (`creator/(tabs)/home.tsx`) reads `GET /creators/me/dashboard` using the shape the
  backend actually returns (`profile` / `stats` / `recentRequests` / `activeCollabsList` — the
  flat shape in `frontend_prompt.md` §2 is out of date): availability switch (optimistic,
  instant-save via `PUT /creators/me/profile`, rolls back with a toast), completeness banner,
  four stat tiles, Trust Score row → explainer sheet, Incoming Requests carousel, Active Collabs
  preview, link to Packages, pull-to-refresh, refetch on focus, skeleton / error / empty states.
  New shared pieces: `MoneyText` + `lib/money.ts` (tested), `lib/deal-status.ts`,
  `hooks/use-refetch-on-focus.ts`, `lib/query-keys.ts`.
- 2026-10-13 (later): **Edit Profile built** (`creator/edit-profile.tsx`, reached from Home's
  "Edit profile" row). Loads `GET /creators/me`, one screen with About you / Location /
  Languages & niches / Social accounts sections and a single Save (disabled until something
  changes) → `PUT /creators/me/profile`. Nothing is required, so a creator who skipped the
  wizard can save one field (`lib/validation/creator-profile.ts`). Mock mode now remembers
  what the wizard and this screen save, so the form opens pre-filled.
- **Not built yet in 2.1:** editing photos and phone from Edit Profile (still wizard-only),
  the availability toggle inside Edit Profile (it is on Home), per-section dirty indicators,
  profile preview (needs 3.2), Recommended Campaigns preview (needs 7.4). Request and collab
  cards are not tappable because Collab Detail (4.2) does not exist. A temporary Log Out button
  sits at the bottom of Home until Settings (8.2).
- Mock mode returns a new account's dashboard: zero earnings, no requests, no collabs. No deals,
  brands or amounts are invented, so the request/collab cards have not been seen with data.
- Checks: typecheck clean, lint 0 errors, 41/41 tests, Android export bundles. **Not run on a
  device or emulator, and not exercised against the real backend.**
- 2026-10-14: **Edit Profile replaced by a profile hub** (user request: profile and package editing should sit under the avatar on Home). Tapping the avatar/name opens `creator/profile.tsx`: completeness bar, "Continue setup", and the seven wizard steps as rows — each opens that step of the wizard pre-filled (`mode=edit`, Save closes it); "Continue setup" resumes the wizard at the first unfinished step (`mode=resume`). The single-form `edit-profile.tsx` was deleted. Home's "Finish profile" banner opens the same hub. Also: "Preview as brands see it", Recommended Campaigns on Home, a notifications bell. Completeness = share of the seven steps done (`lib/profile-setup.ts`). Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 2.2 Creator Packages
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Packages List, Create/Edit Package Sheet)

**Scope:** Packages list (`PackageCard` in `manage` mode), Create/Edit bottom sheet with
price-calculator hint from `/tools/price-calculator`, delete via confirm sheet.

**Definition of Done**
- [x] `PackageCard` is the one shared component reused later in 3.2/3.3/7.x (`manage`/`pick`/
      `display` modes) — do not fork it per screen. Built with all three modes
      (`components/domain/packages/PackageCard.tsx`); only `manage` is used so far.
- [x] Empty state explains bookability impact, not a bare "no packages."

**Progress Log**
- 2026-10-13: Packages list (`creator/packages.tsx`, `GET /creators/me/packages`) with
  `PackageCard` in `manage` mode, an optimistic visible/hidden switch
  (`PUT /creators/me/packages/:id { isActive }`), pull-to-refresh, skeleton / error / empty
  states. Create and edit share `components/domain/packages/PackageForm.tsx` with the wizard's
  step 7 (`creator/package-form.tsx`, `?id=` for edit). Validation now mirrors the backend's
  limits (title 255, quantity 1–100, price up to ₹1 crore). Mock mode keeps packages in memory
  so ones added in the wizard appear in the list.
- **Not built yet in 2.2:** the live "similar creators charge ₹X–₹Y" hint while creating (the
  form shows the server's `recommendedMin`/`recommendedMax` only when editing a saved package),
  Inclusions, and the Platform field (the backend derives platform from content type).
- Checks as for 2.1. **Not run on a device or against the real backend.**
- 2026-10-14: Packages reachable from the profile hub (step 7 and its own row). Delete is still not offered (backend only deactivates — see Deviations). Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 2.3 Incoming Requests & Stats Submission
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Incoming Requests, Request Detail, Stats Submission)

**Scope:** Filtered incoming-requests list sorted soonest-expiring-first with inline
accept/reject, counter-offer sheet (max 2 rounds messaging). Stats Submission as an optional
credibility-boost screen (this is *not* Trust Score itself, which is auto-computed).

**Definition of Done**
- [x] Counter-offer sheet pre-fills offered amount and enforces the round messaging in copy.
- [x] Request Detail is literally Collab Detail at `request_sent` (see 4.2), not a separate screen.

**Progress Log**
- 2026-10-14: Incoming requests live in Collabs → Requests (soonest-expiring first, Accept/Decline on the card) and open Collab Detail for Counter-offer (`creator/collab/counter-offer.tsx`, max 2 rounds). Stats Submission is `creator/stats.tsx` ("Boost your credibility" in the profile hub): numbers + one or two screenshots → `POST /creators/me/stats/submit`, status from `GET /creators/me` `latestSubmission`. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.
- 2026-10-14: Counter-offer field now starts at the brand's offered amount, per spec.

---

## Phase 3 — Brand Core / Discovery

### 3.1 Discover Creators & Filter Sheet
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Discover Creators, Filter Sheet)

**Scope:** Two-column infinite-scroll `CreatorCard` grid, search box, sticky filter/sort bar,
full `FilterSheet` (platform, content type, niche, language, state, follower range, price range
dual slider, trust score, sort picker).

**Definition of Done**
- [x] Active filter count badge shown on the Discover tab's filter button when sheet is closed.
- [ ] `FilterSheet` built once and reused in reduced form on the creator's Open Campaigns screen
      (7.4), not duplicated. — **Open:** Not done — the creator Open Campaigns screen uses its own content-type/niche chips.

**Progress Log**
- 2026-10-14: Brand Discover tab — two-column `CreatorCard` grid (`GET /creators`), Filter Sheet with every spec filter and sort, active-filter badge, infinite scroll. Search narrows the loaded results only: `GET /creators` has no text search. Price uses four preset ranges instead of a dual slider (no slider dependency). The creator Open Campaigns filter uses chips, not a reduced FilterSheet. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 3.2 Creator Profile Detail (Brand View) & Saved Lists
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Creator Profile Detail, Saved Lists)

**Scope:** Full profile hero (cover/profile photo, badges, bio, tags, location, featured reel,
cover gallery), Packages section with `Request This Package` as the primary CTA, reviews summary,
Save-to-List action.

**Definition of Done**
- [x] `Request This Package` is visually the single most prominent action on the screen.
- [x] Saved Lists create/add/remove flow works end to end.

**Progress Log**
- 2026-10-14: `brand/creator/[userId].tsx` (note: `GET /creators/:id` takes the *user* id) with banner, trust, follower ranges, niches, links, packages with a primary "Request this package", brand reviews; bookmark opens Save-to-list sheet. Saved Lists + detail screens (`/brands/me/saved-lists`). The same view is the creator's own preview. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 3.3 Send Collab Request
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Send Collab Request)

**Scope:** Locked package summary, editable offered amount, deadline picker (+7 days default),
reference-link chips, brand notes, `Require draft approval` toggle with one-line explainer.
Success routes straight into the new deal's Collab Detail.

**Definition of Done**
- [x] Package fields (type/quantity/price) are visibly locked/non-editable on this screen.
- [x] Submitting lands the user in Collab Detail for the new deal, not back on Discover.

**Progress Log**
- 2026-10-14: `brand/request.tsx` — locked package card, brief, offer (pre-filled), post-by date (+7 days), reference links, notes, draft-approval toggle → `POST /collabs`, then opens the new deal. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 4 — Collab Lifecycle (core of the app)

### 4.1 My Collabs List Shell
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3 (My Collabs)

**Scope:** Segmented control per role (Creator: Requests/Active/Past; Brand: Direct/Campaign),
`DealCard` (counterpart identity, package title + content-type icon, `MoneyText`, `StatusBadge`,
`CountdownChip` where relevant).

**Definition of Done**
- [x] Status-group mapping for each segment matches §6.3's table exactly.
- [x] `DealCard` is one shared component used by both roles' lists.

**Progress Log**
- 2026-10-14: `CollabsList` for both roles (creator Requests/Active/Past, brand Direct/Campaign), `DealCard` with countdown chip, infinite scroll, pull to refresh. Segments are applied to loaded pages because `GET /collabs` filters one status at a time. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 4.2 Collab Detail Core & Status Stepper
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3 (Collab Detail table), §8 (`DealStatusStepper`)

**Scope:** The single status-driven Collab Detail screen — `DealStatusStepper` (with-draft vs
without-draft step arrays, red terminal branch for negative statuses), the primary action card
switched by `(status, viewer role)` for every row in §6.3's table up through `accepted`
(request/accept/reject/counter, waiting states). Brief & Details collapsible section, Fee
Breakdown card. Later sprints (4.3–4.6) plug additional statuses into this same screen — this
sprint should not hardcode statuses in a way that blocks that.

**Definition of Done**
- [x] One screen, no per-status screen forks, matching the spec's explicit instruction.
- [x] `request_sent` and `accepted` (both counter-offer sub-states) fully functional for both
      roles.
- [x] Terminal negative statuses (`rejected`/`expired`/`cancelled`) render correctly with reason.

**Progress Log**
- 2026-10-14: `components/domain/collab/CollabDetail.tsx` (routes `creator|brand/collab/[id]`): header, one action card per (status, role) following the backend's rules (counter-offers keep `request_sent`), vertical `DealStatusStepper` with a red terminal step, Brief & details, Money card from `fee-breakdown`, Message button once escrow is paid. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 4.3 Payments — Razorpay Escrow Checkout
**Status:** 🔄 In Progress
**Spec refs:** prompt.md §6.6 (Razorpay Checkout Flow), §6.3 (`accepted` → `Pay Now` row)

**Scope:** Fee Breakdown confirm sheet → `create-order` → `RazorpayCheckout.open` → `lock-escrow`
→ success toast + `active` status. Cancel/failure keeps deal at `accepted` with retry, no
partial-state confusion.

**Definition of Done**
- [x] User always sees total fee breakdown before entering the payment SDK — no skip path.
- [ ] SDK failure leaves deal state untouched and recoverable. — **Open:** Blocked on the Razorpay SDK (4.3); mock payment cannot fail.
- [x] Chat thread becomes reachable immediately once escrow locks (ties into 5.1).

**Progress Log**
- 2026-10-14: Pay Now shows the server fee breakdown in a sheet, then settles via `POST /collabs/:id/pay` in mock mode ("Demo payment"). **Not done:** the real Razorpay `create-order` → checkout → `lock-escrow` flow — needs `react-native-razorpay` and a dev build.

---

### 4.4 Draft Approval Flow
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3/§6.4 (Draft Submission), §6.5 (Draft Review)

**Scope:** Creator Draft Submission (upload, round number, prior feedback), Brand Draft Review
(full-screen view-only media viewer, no save affordance, Approve / Request Changes).

**Definition of Done**
- [x] This step only appears in the stepper/action-card when `deal.requiresDraftApproval === true`.
- [x] Request Changes loops back to a new submission round with feedback visible to the creator.
- [x] Media viewer has no download/save affordance (matches backend's view-only intent).

**Progress Log**
- 2026-10-14: Creator sends image/video drafts (multipart field `draft`); brand sees the pending draft with Approve / Request changes (`brand/collab/request-changes.tsx`); posting stays blocked until a draft is approved. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 4.5 Submit Post, Verify & Dispute
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Submit Post), §6.3 (`post_submitted` row), §6.3 (Dispute Screen)

**Scope:** Submit Post form (URL pattern validation, auto-detected platform, optional screenshot,
pre-submit confirm sheet explaining the 48h auto-approve window), Brand's Verify & Release /
Raise Dispute actions, Dispute Screen (reason chips + free text + evidence, confirm sheet).

**Definition of Done**
- [x] Submit Post is disabled/unreachable (with an explanatory message) if draft approval is
      required but not yet approved — mirrors backend's 403.
- [x] Countdown to 48h auto-approve is visible to the creator after submission.
- [x] Dispute submission requires the confirm-sheet step (irreversible-action pattern).

**Progress Log**
- 2026-10-14: Submit Post (`creator/collab/submit-post.tsx`: URL validation, platform auto-detect, optional screenshot, 48h confirm), Verify & release (confirm), Dispute (`brand/collab/dispute.tsx`: category + details + evidence links, confirm). Auto-approve after 48h and request expiry are emulated on read. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 4.6 Review & Rating, Performance Reports
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3 (Review & Rating Modal), §6.4 (Performance Report Submission)

**Scope:** One-time star + comment review modal (read-only if already reviewed), Performance
Report Submission triggered at 7d/30d marks on completed deals.

**Definition of Done**
- [x] Review form flips to read-only display if `GET /collabs/:dealId/review` already has one.
- [x] Performance report reminder only shows when no report of that interval type exists yet.

**Progress Log**
- 2026-10-14: Review screen per role (stars + comment, once per side), reviews shown on completed deals; 7-day / 30-day performance report screen, unlocked from day 6 / 28 as the backend requires. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 5 — Messaging

### 5.1 Messaging (Conversations & Chat Thread)
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3 (Messages — Conversations List, Chat Thread), §8 (`ChatBubble`)

**Scope:** Conversations list (escrow-gating empty-state copy), Chat Thread (text/image/video/pdf
bubbles, read receipts, deal-context header chip, attachment flow — text sent first, then
attachment per API note), long-press Report action sheet.

**Definition of Done**
- [x] A deal with no escrow lock never appears as a reachable thread (not just hidden — actually
      absent from the list, per spec).
- [x] Header chip jumps straight to that deal's Collab Detail.
- [x] Report action wired for all three reasons (harassment/abuse/off_platform).

**Progress Log**
- 2026-10-14: Inbox tab (conversations, unread pills, escrow-gating empty state, notifications link) and Chat Thread (bubbles, read receipt, image attachments sent text-first, long-press report, read-only once archived). Polls every 5s — no socket. Inbox tab badge = unread messages + notifications. Only image attachments; no video/PDF yet. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 6 — Wallet, Payouts & Billing

### 6.1 Creator Wallet & Payout Accounts
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Wallet, Payout History, Payout Accounts Management, Add/Edit sheet)

**Scope:** Wallet summary (lifetime-paid-out headline with pending/completed explainer tap
target), pending/processing/on-hold tiles, monthly chart, Payout History with status-mapped
badges and hold/failed reason info icons, Payout Accounts CRUD (delete blocked with explanatory
toast when a pending/processing payout is attached).

**Definition of Done**
- [ ] Status badge color/label mapping matches the backend's table exactly, one source-of-truth
      object (reused from `StatusBadge` in 0.2). — **Open:** One source of truth exists (`lib/payout-accounts.ts`), built from the backend `payout_status` enum; not yet cross-checked against `frontend_prompt.md` §18.
- [x] Deleting an in-use payout account shows the blocking toast, doesn't silently fail.

**Progress Log**
- 2026-10-14: Wallet tab (lifetime paid-out headline with explainer, Queued / On its way / On hold tiles that filter history, 6-month bar chart, payout history with expandable breakdowns) and Payout Accounts (list, make primary, remove, add UPI or bank with IFSC lookup). Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 6.2 Brand Billing & Analytics
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Billing & Transactions, Analytics)

**Scope:** Escrow transaction list + detail drill-down, Analytics stat tiles, monthly spend chart,
Top Creators list, Spend by Niche breakdown.

**Definition of Done**
- [x] Transaction detail links back to the originating Collab Detail.

**Progress Log**
- 2026-10-14: Billing (`brand/billing.tsx` + `[id]`) with "where the money is" badges, and Analytics (stat tiles, monthly spend chart, funnel, spend by niche, content types, top creators). Spend-by-niche is derived client/mock-side — the backend analytics payload has no niche breakdown. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 7 — Campaigns

### 7.1 Campaigns List & Create Campaign
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Campaigns List, Create Campaign)

**Scope:** Campaign list with status segmented filter, Create Campaign with the type toggle
(Brand-Invite vs Open Application) at the top driving genuinely different field sets below it,
split across 2–3 logical form sections.

**Definition of Done**
- [x] Switching the type toggle mid-form doesn't silently discard already-entered shared fields.
- [x] Auto-Accept toggle (Open Application) shows its explainer copy.

**Progress Log**
- 2026-10-14: Campaigns tab (status chips, `CampaignCard` that marks Brand-Invite vs Open Application, Create button) and Create Campaign in three steps with a type choice first (`brand/campaign/new.tsx`). Editing an existing campaign is not built (pause/resume and cancel are). Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 7.2 Campaign Tracker — Brand-Invite Path
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Campaign Detail/Tracker, Invite Creators to Campaign)

**Scope:** Creators tab (per-creator deal status), Invite Creators screen (Discover reused in
campaign context, client-side duplicate-invite blocking on top of server 409).

**Definition of Done**
- [x] Already-invited/accepted creators show a disabled state without waiting on a server error.
- [x] Cancel Campaign shows the deals/escrow-refund impact preview before confirming.

**Progress Log**
- 2026-10-14: Brand-Invite tracker (`brand/campaign/[id].tsx`): creators with deal status, budget bar, Invite Creators (`brand/campaign/invite.tsx`: niche-matched, pick package + offer inline, already-invited disabled), pause/resume, cancel with an impact preview. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 7.3 Campaign Tracker — Open Application Path
**Status:** ✅ Done
**Spec refs:** prompt.md §6.5 (Campaign Detail/Tracker — Open Application)

**Scope:** Applications tab (pending/approved/declined filter, approve/decline per applicant with
follower range/trust score/engagement/pitch shown), Accepted Creators tab.

**Definition of Done**
- [x] Approving an application correctly creates a Deal and routes/links into the standard
      lifecycle from `accepted` onward (reuses 4.2+, no separate campaign-deal screen).

**Progress Log**
- 2026-10-14: Open Application tracker: New / Approved / Declined applications with trust, follower range, package, pitch; Approve creates the request (creator still accepts, then the brand pays). Auto-accept supported. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 7.4 Creator Side — Discover & Apply to Campaigns
**Status:** ✅ Done
**Spec refs:** prompt.md §6.4 (Open Campaigns, Campaign Detail creator view + Apply Sheet, My
Applications)

**Scope:** Open Campaigns discover list (two distinct empty states — none-exist vs
not-eligible-yet), Campaign Detail with requirement met/not-met checks against the creator's own
profile, Apply sheet (package + pitch), My Applications list.

**Definition of Done**
- [x] Applying immediately removes the campaign from the Discover list via query invalidation.
- [x] Approved applications link into the resulting Collab Detail.

**Progress Log**
- 2026-10-14: Creator Campaigns tab (eligible open campaigns, content-type and niche chips, "add niches" empty state), campaign detail with requirement checks, Apply (pick package + optional pitch), My Applications. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

## Phase 8 — Shared/Global Polish

### 8.1 Notifications & Deep Linking
**Status:** 🔄 In Progress
**Spec refs:** prompt.md §6.3 (Notifications), §5, §10 (Push notifications, Deep linking)

**Scope:** Notifications list (type-icon map, mark-read, mark-all-read), Expo push registration
post-onboarding with a pre-permission explainer, deep-link handling for `metadata.dealId`/
`campaignId` taps and for password reset / public profile sharing links.

**Definition of Done**
- [ ] Tapping a push notification routes straight into the relevant Collab/Campaign Detail, app
      cold-start included, not just when already running. — **Open:** Push not built; in-app notification taps already route to the deal/campaign.

**Progress Log**
- 2026-10-14: In-app Notifications screen for both roles (icons per type, unread bar, mark read on tap + Mark all read, routes to the deal/campaign) and a bell with unread dot on both Homes. **Not done:** push via expo-notifications and OS deep links — need the backend and a dev build.

---

### 8.2 Settings
**Status:** ✅ Done
**Spec refs:** prompt.md §6.3 (Settings, Change Password)

**Scope:** Account/Payments/Notifications/Appearance/Support/Legal groups, theme override
(system/light/dark wired to the theme system from 0.2), logout confirm sheet, Change Password.

**Definition of Done**
- [ ] Theme override actually changes rendered theme app-wide, persists across restarts. — **Open:** Not offered — the app is light-only by design (CLAUDE.md).

**Progress Log**
- 2026-10-14: Settings for both roles (email, profile, change password, payments, push preference saved locally, log out with confirm, version) and Change Password. Appearance is not offered (light-only by design); Support/Legal rows wait for real URLs. Built against the mock server (`src/lib/api/mock/`) in the backend's request/response shapes; not run on a device and not called against the real backend.

---

### 8.3 Creator Tools Hub (bonus, low priority)
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Creator Tools Hub)

**Scope:** In-app wrapper for Price Calculator, Fake-Follower Checker, personal Analytics Log,
read-only Brief/Contract template viewers — surfaced from Settings/dashboard, not a dedicated tab.

**Definition of Done**
- [ ] Build only after all core-transaction-flow sprints (0–7) are complete, per spec priority. — **Open:** Sprint not started.

**Progress Log**
- _(none yet)_

---

## Phase 9 — Non-Functional Hardening

### 9.1 Non-Functional Hardening
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §10

**Scope:** Offline/cached-data behavior on every list screen (cache-first render + subtle
reconnecting indicator vs. cold-start skeleton), accessibility pass (44×44 tap targets, labels,
color-never-alone-as-signal, font-scaling to 120–150%), performance (FlashList/windowed lists,
image caching/lazy blur-placeholder in chat).

**Definition of Done**
- [ ] Spot-check every list screen at 150% system font scale without broken layout. — **Open:** Not done — needs a device.
- [ ] Every `StatusBadge`/`TrustBadge` usage confirmed to pair color with text. — **Open:** Not audited yet (badges are built with labels, but no sweep done).

**Progress Log**
- _(none yet)_

---

### 9.2 Analytics Instrumentation & Release Prep
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §10

**Scope:** Clean, vendor-agnostic event names for screen views + key funnel events (onboarding
step completion/drop-off, request sent→accepted rate, campaign apply rate, payment
success/failure, dispute rate). Final environment/config review before a release build.

**Definition of Done**
- [ ] Funnel event list reviewed against §10's exact list, nothing missing. — **Open:** Sprint not started.
- [ ] Prod/staging/dev API base URLs confirmed switchable via env config only. — **Open:** `EXPO_PUBLIC_API_BASE_URL` exists; not confirmed per environment.

**Progress Log**
- _(none yet)_

---

## Deviations from Spec

- **Mock server instead of empty mocks (2026-10-14).** User request: "end to end mock data working to
  demonstrate the app fully … after the completion we will go to api binding". `src/lib/api/mock/`
  is an in-memory database shaped like the Prisma models (users, creator/brand profiles, packages,
  deals with status logs, escrow, drafts, submissions, disputes, reviews, reports, campaigns,
  applications, messages, notifications, payout accounts, payouts, saved lists, stats), seeded with
  two demo accounts plus seven other made-up creators and three brands, and saved to AsyncStorage.
  Every `lib/api/*.ts` function keeps its real `apiClient` call; the mock branch replaces it while
  `IS_MOCK_API` is on. Backend cron jobs (request expiry, 48h auto-approve, payout settlement,
  stats review) are emulated lazily on read. This supersedes the earlier rule that mocks hold no
  invented data — the demo data is reachable only in mock mode.
- **Edit Profile as a hub, not a form (2026-10-14).** Spec §6.4 asks for a single-screen Edit
  Profile; per the user, editing goes through the same seven wizard steps from the profile screen.
- **No Razorpay yet (2026-10-14).** Pay Now uses `POST /collabs/:id/pay`-style settlement in mock
  mode. The create-order → checkout → lock-escrow sequence is pending (needs a dev build).

Running log of any place the implementation intentionally diverges from `prompt.md` (missing
backend field, ambiguous spec, deliberate scope cut) — so later sprints and the user aren't
surprised by a mismatch. Append as they come up; leave empty otherwise.

- **API reference found; three contract mismatches fixed (2026-10-13).** `frontend_prompt.md`
  and the backend source live in the sibling `../influencer_backend/` folder. Checked against
  the backend code: (1) content-type values were `shorts` / `live` — the backend enum is
  `youtube_shorts` / `youtube_live`, so those two would have failed validation; (2) upload field
  names were `photo` / `photos` — the backend reads `profilePhoto` / `coverPhotos`; (3)
  `createPackage` returns the full package, not just `{ id }`. Still unreconciled and still
  marked PROVISIONAL: `lib/auth/types.ts`, `lib/api/auth.ts`, the NICHES/LANGUAGES lists
  (`lib/api/brand.ts` was reconciled later the same day).
- **No brand logo upload (2026-10-13).** The app used to post a logo to `/brands/me/logo`, an
  endpoint that does not exist on the backend (`logoUrl` only accepts an already-hosted URL).
  The logo picker was removed from the company profile; an existing `logoUrl` is still shown.
  Needs a backend upload endpoint.
- **Blank optional URLs (2026-10-13).** The backend validates `youtubeChannelUrl` with
  `.url()`, so the wizard's step 4 would have failed for anyone leaving YouTube blank.
  `updateCreatorProfile` now omits a blank YouTube URL and sends a blank featured reel as
  `null`. Side effect: a saved YouTube URL cannot be cleared from the app (the backend field
  is not nullable).
- **No "Delete package" (2026-10-13).** The spec asks for delete via a confirm sheet. The
  backend's `DELETE /creators/me/packages/:id` only sets `isActive: false`, and
  `GET /creators/me/packages` still returns the package, so a Delete button would leave the
  item on screen. The Packages screen offers a visible/hidden switch instead. A real delete
  needs a backend change.
- **Create/Edit Package is a pushed screen, not a bottom sheet (2026-10-13).** The form has text
  fields and a text area; a full screen reuses `Screen`'s existing keyboard handling, where a
  sheet would need `BottomSheetTextInput` plumbing that can't be verified without a device.
- **Creator routes use a real `creator/` segment, not a `(creator)` group (2026-10-13)**, so
  `/creator/home` can't collide with a future `/brand/home`.

- **App renamed to FindCollab, branding/design polish pass applied across all of Phase 1
  (2026-10-12).** User-requested rename + "make it look top class" — see CLAUDE.md's "Branding"
  section for the full rundown (brand mark + icon generation script, Screen-level entrance
  animation, Button press feedback, themed status bar, selective haptics via `lib/haptics.ts`).
  Not a prompt.md deviation (prompt.md doesn't specify branding), logged here because it touched
  files across every already-"done" sprint in one pass rather than being scoped to one sprint
  number — if a later sprint's screen looks inconsistent with this, it's missing this polish
  layer, not a new one needed.
- **Second design pass, round 2 (2026-10-12, same day, user feedback "too simple")**: added
  `components/ui/HeroOrb.tsx` (soft oversized low-opacity color washes behind hero content — no
  literal gradients, stays within prompt.md §3's "no gradients or skeuomorphism" rule but adds
  real atmosphere) and a `backdrop` prop on `Screen` so it renders fixed behind scrollable content
  instead of scrolling away with it. Applied across the whole "initial setup" continuum: Welcome
  (converted to use `Screen` instead of a bare `View`, now properly safe-area-aware), Login,
  Forgot/Reset Password, Role Selection (cards got press-scale + staggered entrance + a selected
  checkmark badge), Bank Setup, How It Works (brand steps: numbered badges + staggered slide-in;
  creator: bigger shadowed icon badge), Creator Wizard's success screen, Brand Profile Setup.
  Icon badges standardized on a `h-24 w-24 rounded-[28px] bg-brand` shape with a colored drop
  shadow (`shadowColor` = the icon's own tint) — reuse that shape for any future hero icon moment
  rather than inventing a new one.
- **Fixed a real navigation bug found by the user while testing**: completing Bank Setup bounced
  back to Role Selection instead of advancing to How It Works. Root cause:
  `bank-setup.tsx`'s mount guard effect depended on the reactive `draft.accountType` value, and
  the success handler called `draft.clear()` (making `accountType` null) *before* the
  `router.replace('/(onboarding)/how-it-works')` navigation had actually taken effect — the
  resulting re-render re-fired the guard effect, which raced against (and sometimes won over) the
  real navigation. Fixed by making that guard a mount-only check (empty deps, reads
  `useOnboardingDraftStore.getState()` imperatively instead of subscribing reactively) — see the
  comment at that effect for the full explanation. Worth remembering as a pattern: a guard effect
  that redirects based on store state the same `onSuccess` handler is about to clear is a latent
  race condition — check for this shape anywhere else a similar "arrived without prerequisite
  state" guard exists.
- **Fixed a keyboard/scroll bug found by the user while testing (2026-10-12)**: on forms with
  several stacked fields (Bank Setup, Brand Profile Setup, etc.), focusing a field could leave
  content below it unreachable by scroll once the keyboard was open. Root cause: `Screen`'s
  `keyboardAvoiding` wrapped the `ScrollView` in a `KeyboardAvoidingView`, which measures its
  ancestor's position in the window to compute how much padding to reserve for the keyboard — and
  that measurement came back stale while nested inside `Screen`'s mount-animation `MotiView`
  (which moves via a transform), under-reserving space. Fixed by dropping that wrapper for the
  `scroll` case and using the `ScrollView`'s own native keyboard-inset handling instead
  (`automaticallyAdjustKeyboardInsets` + `contentInsetAdjustmentBehavior="automatic"`), which
  doesn't depend on ancestor measurement — see CLAUDE.md's "Keyboard handling" note for the full
  writeup. Also added `Keyboard.dismiss()` on `Input`'s `onBlur` (and before opening a `Select`
  sheet / toggling the Brand Profile `Switch`) per the user's request that the keyboard close
  automatically once focus moves away from a text field.
- **Third design pass: palette refresh (2026-10-12, user feedback "make the theme different,
  aesthetic professional app for influencers and brand")**: replaced the original flat cold-gray
  neutrals with a warmer "premium creator-platform" pairing — warm ivory in light mode, deep
  plum-tinted charcoal in dark mode — while keeping the brand violet itself unchanged so the app
  icon didn't need regenerating. See CLAUDE.md's "Palette refresh" note for the exact values and
  the three files (`theme.ts`, `global.css`, `tailwind.config.js`) that must stay in sync by hand.
- **Router folder is `src/app`, not repo-root `app/`.** `create-expo-app@latest`'s current default
  template (Expo SDK 57) scaffolds under `src/`; adopted it rather than fighting the template, and
  updated CLAUDE.md's folder-structure section to match. Functionally equivalent to the originally
  sketched layout.
- **Auth API types are provisional.** `frontend_prompt.md` (the backend API reference) isn't in
  this repo. `src/lib/auth/types.ts`'s `AuthUser`/`AuthSession`/`AuthTokens` and the request/response
  shapes in `src/lib/api/auth.ts` are inferred from what prompt.md states inline (endpoint paths,
  the `accountType`/bank-account/phone-verified fields the root gate logic needs) — reconcile
  against the real spec before wiring real screens to them.
- **Google OAuth redirect contract is assumed, not confirmed.** Implemented as: `GET
  /auth/google/url` → `expo-web-browser.openAuthSessionAsync(url, redirectUrl)` where `redirectUrl
  = Linking.createURL('google-callback')` → parse `?code=` from the returned redirect URL → `POST
  /auth/google/callback`. Whether the backend needs to be told this app-generated redirect URI (vs.
  using a fixed one of its own) is unverified.
- **Web is broken, both dev and static export** — `expo start --web` and `expo export --platform
  web` both throw inside `expo-secure-store`'s web shim (`setValueWithKeyAsync is not a function`)
  because `app.json`'s `web.output: "static"` routes even the dev server through Node-side SSR.
  (Earlier notes in this log said `expo start --web` worked — verified 2026-09-30 that it does not;
  correcting that here.) Not fixed: web isn't a target platform per prompt.md §2 (iOS + Android
  only). `expo export --platform android`/`--ios` both compile cleanly and are the right way to
  sanity-check a real bundle without a device.
- **`react-native-razorpay` not installed yet.** It's native-module-only (no Expo Go support,
  needs a dev build) and isn't used until Sprint 4.3 — deferred rather than installed early and
  left unused.
- **No real device/simulator/emulator was available to actually launch the app in this
  environment** (no adb/Android emulator, no iOS simulator, no browser-automation tool, and web is
  broken per above). Every sprint through Phase 1 has been verified via typecheck, lint, unit
  tests, and a real Android bundle export (`expo export --platform android`), but none of it has
  been visually run and clicked through yet. Do that via Expo Go or a simulator before considering
  Phase 1 fully verified, not just built.
- **Mock-mode layer (`src/lib/api/mock-mode.ts`)** stands in for the entire backend (default on —
  see CLAUDE.md's "Mock mode" section). Every `src/lib/api/*.ts` function branches on it. Delete it
  and all `IS_MOCK_API` branches once a real backend exists — it is explicitly not meant to become
  permanent scaffolding.
- **`lib/constants.ts`'s NICHES/LANGUAGES lists are a stand-in, not the verified BRD list.**
  prompt.md §6.2 says to hardcode "the 20-niche / 12-language sets from the BRD" but doesn't
  enumerate them inline. The 20/12 items here are a reasonable India-market-relevant guess at the
  right count and flavor — reconcile against the real BRD or `frontend_prompt.md`'s enum before
  shipping, since Discover's filter sheet (Sprint 3.1) will need to match exactly.
- **Creator Wizard resume is in-memory only, not real.** `lib/auth/creator-wizard-store.ts` holds
  step progress in a Zustand store with no persistence — surviving navigation away-and-back within
  a running session, but not an app kill/restart. prompt.md's real intent (checking
  `GET /creators/me` field presence to resume after a restart) needs a live backend to check
  against; revisit once one exists.
