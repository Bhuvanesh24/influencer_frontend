# InfluenceHub — Sprint Plan & Progress Tracker

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

## Progress Overview

| # | Sprint | Status |
|---|---|---|
| 0.1 | Project Scaffold & Tooling | ✅ Done |
| 0.2 | Design System & Core UI Primitives | 🔄 In Progress |
| 0.3 | App Infrastructure (API client, auth store, nav shell) | 🔄 In Progress |
| 1.1 | Pre-Auth Flow | ✅ Done |
| 1.2 | Onboarding Core (Role, Bank, How It Works) | ✅ Done |
| 1.3 | Creator Profile Setup Wizard | ⬜ Not Started |
| 1.4 | Brand Profile Setup & Completeness Banners | ⬜ Not Started |
| 2.1 | Creator Dashboard & Edit Profile | ⬜ Not Started |
| 2.2 | Creator Packages | ⬜ Not Started |
| 2.3 | Incoming Requests & Stats Submission | ⬜ Not Started |
| 3.1 | Discover Creators & Filter Sheet | ⬜ Not Started |
| 3.2 | Creator Profile Detail (Brand View) & Saved Lists | ⬜ Not Started |
| 3.3 | Send Collab Request | ⬜ Not Started |
| 4.1 | My Collabs List Shell | ⬜ Not Started |
| 4.2 | Collab Detail Core & Status Stepper | ⬜ Not Started |
| 4.3 | Payments — Razorpay Escrow Checkout | ⬜ Not Started |
| 4.4 | Draft Approval Flow | ⬜ Not Started |
| 4.5 | Submit Post, Verify & Dispute | ⬜ Not Started |
| 4.6 | Review & Rating, Performance Reports | ⬜ Not Started |
| 5.1 | Messaging (Conversations & Chat Thread) | ⬜ Not Started |
| 6.1 | Creator Wallet & Payout Accounts | ⬜ Not Started |
| 6.2 | Brand Billing & Analytics | ⬜ Not Started |
| 7.1 | Campaigns List & Create Campaign | ⬜ Not Started |
| 7.2 | Campaign Tracker — Brand-Invite Path | ⬜ Not Started |
| 7.3 | Campaign Tracker — Open Application Path | ⬜ Not Started |
| 7.4 | Creator Side — Discover & Apply to Campaigns | ⬜ Not Started |
| 8.1 | Notifications & Deep Linking | ⬜ Not Started |
| 8.2 | Settings | ⬜ Not Started |
| 8.3 | Creator Tools Hub (bonus, low priority) | ⬜ Not Started |
| 9.1 | Non-Functional Hardening (offline, a11y, perf) | ⬜ Not Started |
| 9.2 | Analytics Instrumentation & Release Prep | ⬜ Not Started |

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
      listed in the spec (not just a default state). *(partial — see log)*
- [ ] Currency renders via `MoneyText` with tabular-nums alignment. *(not built yet)*
- [ ] A component gallery/dev screen (throwaway, not shipped) exists to visually QA all primitives
      together before building real screens on top of them. *(not built yet)*

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
      backend (none available in this repo).
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
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.2 (wizard table, steps 1–7)

**Scope:** 7-step wizard (Identity, Location, Languages & Niches, Social Accounts, Photos, Phone
Verification, First Package), each step calling its own endpoint (not a batched final submit) so
progress persists if the user leaves mid-flow. Success screen → Creator Home. Profile-completeness
banner (computed client-side from `GET /creators/me` field presence).

**Definition of Done**
- [ ] Leaving the wizard after step 3 and returning resumes at step 3, not step 1.
- [ ] Niche multi-select hard-caps at 5 with correct counter/disabled-state UX.
- [ ] Photo upload supports per-image retry without restarting the whole step.
- [ ] OTP flow has working resend cooldown (30s).
- [ ] Skipping step 7 (First Package) produces a visibly stronger nudge on Home than skipping
      earlier steps.

**Progress Log**
- _(none yet)_

---

### 1.4 Brand Profile Setup & Completeness Banners
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.2 (Brand Profile Setup)

**Scope:** Brand Company Info screen (reachable from Settings, not force-shown), lighter-touch
completeness nudge on Brand Home.

**Definition of Done**
- [ ] Brand can fully use the app having only completed mandatory onboarding (this screen is
      genuinely optional, not soft-blocking anything).

**Progress Log**
- _(none yet)_

---

## Phase 2 — Creator Core

### 2.1 Creator Dashboard & Edit Profile
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Creator Dashboard, Edit Creator Profile)

**Scope:** Home layout (availability toggle, completeness banner, stat row incl. tappable Trust
Score explainer sheet, Incoming Requests carousel, Active Collabs preview, Recommended Campaigns
preview). Edit Profile as single-screen sectioned form with a public preview mode.

**Definition of Done**
- [ ] Availability toggle is an instant-save switch, no separate save step.
- [ ] Preview-as-brands-see-it opens the real Creator Profile Detail screen read-only (reused
      from 3.2, not a duplicate screen).

**Progress Log**
- _(none yet)_

---

### 2.2 Creator Packages
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Packages List, Create/Edit Package Sheet)

**Scope:** Packages list (`PackageCard` in `manage` mode), Create/Edit bottom sheet with
price-calculator hint from `/tools/price-calculator`, delete via confirm sheet.

**Definition of Done**
- [ ] `PackageCard` is the one shared component reused later in 3.2/3.3/7.x (`manage`/`pick`/
      `display` modes) — do not fork it per screen.
- [ ] Empty state explains bookability impact, not a bare "no packages."

**Progress Log**
- _(none yet)_

---

### 2.3 Incoming Requests & Stats Submission
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Incoming Requests, Request Detail, Stats Submission)

**Scope:** Filtered incoming-requests list sorted soonest-expiring-first with inline
accept/reject, counter-offer sheet (max 2 rounds messaging). Stats Submission as an optional
credibility-boost screen (this is *not* Trust Score itself, which is auto-computed).

**Definition of Done**
- [ ] Counter-offer sheet pre-fills offered amount and enforces the round messaging in copy.
- [ ] Request Detail is literally Collab Detail at `request_sent` (see 4.2), not a separate screen.

**Progress Log**
- _(none yet)_

---

## Phase 3 — Brand Core / Discovery

### 3.1 Discover Creators & Filter Sheet
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Discover Creators, Filter Sheet)

**Scope:** Two-column infinite-scroll `CreatorCard` grid, search box, sticky filter/sort bar,
full `FilterSheet` (platform, content type, niche, language, state, follower range, price range
dual slider, trust score, sort picker).

**Definition of Done**
- [ ] Active filter count badge shown on the Discover tab's filter button when sheet is closed.
- [ ] `FilterSheet` built once and reused in reduced form on the creator's Open Campaigns screen
      (7.4), not duplicated.

**Progress Log**
- _(none yet)_

---

### 3.2 Creator Profile Detail (Brand View) & Saved Lists
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Creator Profile Detail, Saved Lists)

**Scope:** Full profile hero (cover/profile photo, badges, bio, tags, location, featured reel,
cover gallery), Packages section with `Request This Package` as the primary CTA, reviews summary,
Save-to-List action.

**Definition of Done**
- [ ] `Request This Package` is visually the single most prominent action on the screen.
- [ ] Saved Lists create/add/remove flow works end to end.

**Progress Log**
- _(none yet)_

---

### 3.3 Send Collab Request
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Send Collab Request)

**Scope:** Locked package summary, editable offered amount, deadline picker (+7 days default),
reference-link chips, brand notes, `Require draft approval` toggle with one-line explainer.
Success routes straight into the new deal's Collab Detail.

**Definition of Done**
- [ ] Package fields (type/quantity/price) are visibly locked/non-editable on this screen.
- [ ] Submitting lands the user in Collab Detail for the new deal, not back on Discover.

**Progress Log**
- _(none yet)_

---

## Phase 4 — Collab Lifecycle (core of the app)

### 4.1 My Collabs List Shell
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (My Collabs)

**Scope:** Segmented control per role (Creator: Requests/Active/Past; Brand: Direct/Campaign),
`DealCard` (counterpart identity, package title + content-type icon, `MoneyText`, `StatusBadge`,
`CountdownChip` where relevant).

**Definition of Done**
- [ ] Status-group mapping for each segment matches §6.3's table exactly.
- [ ] `DealCard` is one shared component used by both roles' lists.

**Progress Log**
- _(none yet)_

---

### 4.2 Collab Detail Core & Status Stepper
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (Collab Detail table), §8 (`DealStatusStepper`)

**Scope:** The single status-driven Collab Detail screen — `DealStatusStepper` (with-draft vs
without-draft step arrays, red terminal branch for negative statuses), the primary action card
switched by `(status, viewer role)` for every row in §6.3's table up through `accepted`
(request/accept/reject/counter, waiting states). Brief & Details collapsible section, Fee
Breakdown card. Later sprints (4.3–4.6) plug additional statuses into this same screen — this
sprint should not hardcode statuses in a way that blocks that.

**Definition of Done**
- [ ] One screen, no per-status screen forks, matching the spec's explicit instruction.
- [ ] `request_sent` and `accepted` (both counter-offer sub-states) fully functional for both
      roles.
- [ ] Terminal negative statuses (`rejected`/`expired`/`cancelled`) render correctly with reason.

**Progress Log**
- _(none yet)_

---

### 4.3 Payments — Razorpay Escrow Checkout
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.6 (Razorpay Checkout Flow), §6.3 (`accepted` → `Pay Now` row)

**Scope:** Fee Breakdown confirm sheet → `create-order` → `RazorpayCheckout.open` → `lock-escrow`
→ success toast + `active` status. Cancel/failure keeps deal at `accepted` with retry, no
partial-state confusion.

**Definition of Done**
- [ ] User always sees total fee breakdown before entering the payment SDK — no skip path.
- [ ] SDK failure leaves deal state untouched and recoverable.
- [ ] Chat thread becomes reachable immediately once escrow locks (ties into 5.1).

**Progress Log**
- _(none yet)_

---

### 4.4 Draft Approval Flow
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3/§6.4 (Draft Submission), §6.5 (Draft Review)

**Scope:** Creator Draft Submission (upload, round number, prior feedback), Brand Draft Review
(full-screen view-only media viewer, no save affordance, Approve / Request Changes).

**Definition of Done**
- [ ] This step only appears in the stepper/action-card when `deal.requiresDraftApproval === true`.
- [ ] Request Changes loops back to a new submission round with feedback visible to the creator.
- [ ] Media viewer has no download/save affordance (matches backend's view-only intent).

**Progress Log**
- _(none yet)_

---

### 4.5 Submit Post, Verify & Dispute
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Submit Post), §6.3 (`post_submitted` row), §6.3 (Dispute Screen)

**Scope:** Submit Post form (URL pattern validation, auto-detected platform, optional screenshot,
pre-submit confirm sheet explaining the 48h auto-approve window), Brand's Verify & Release /
Raise Dispute actions, Dispute Screen (reason chips + free text + evidence, confirm sheet).

**Definition of Done**
- [ ] Submit Post is disabled/unreachable (with an explanatory message) if draft approval is
      required but not yet approved — mirrors backend's 403.
- [ ] Countdown to 48h auto-approve is visible to the creator after submission.
- [ ] Dispute submission requires the confirm-sheet step (irreversible-action pattern).

**Progress Log**
- _(none yet)_

---

### 4.6 Review & Rating, Performance Reports
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (Review & Rating Modal), §6.4 (Performance Report Submission)

**Scope:** One-time star + comment review modal (read-only if already reviewed), Performance
Report Submission triggered at 7d/30d marks on completed deals.

**Definition of Done**
- [ ] Review form flips to read-only display if `GET /collabs/:dealId/review` already has one.
- [ ] Performance report reminder only shows when no report of that interval type exists yet.

**Progress Log**
- _(none yet)_

---

## Phase 5 — Messaging

### 5.1 Messaging (Conversations & Chat Thread)
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (Messages — Conversations List, Chat Thread), §8 (`ChatBubble`)

**Scope:** Conversations list (escrow-gating empty-state copy), Chat Thread (text/image/video/pdf
bubbles, read receipts, deal-context header chip, attachment flow — text sent first, then
attachment per API note), long-press Report action sheet.

**Definition of Done**
- [ ] A deal with no escrow lock never appears as a reachable thread (not just hidden — actually
      absent from the list, per spec).
- [ ] Header chip jumps straight to that deal's Collab Detail.
- [ ] Report action wired for all three reasons (harassment/abuse/off_platform).

**Progress Log**
- _(none yet)_

---

## Phase 6 — Wallet, Payouts & Billing

### 6.1 Creator Wallet & Payout Accounts
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Wallet, Payout History, Payout Accounts Management, Add/Edit sheet)

**Scope:** Wallet summary (lifetime-paid-out headline with pending/completed explainer tap
target), pending/processing/on-hold tiles, monthly chart, Payout History with status-mapped
badges and hold/failed reason info icons, Payout Accounts CRUD (delete blocked with explanatory
toast when a pending/processing payout is attached).

**Definition of Done**
- [ ] Status badge color/label mapping matches the backend's table exactly, one source-of-truth
      object (reused from `StatusBadge` in 0.2).
- [ ] Deleting an in-use payout account shows the blocking toast, doesn't silently fail.

**Progress Log**
- _(none yet)_

---

### 6.2 Brand Billing & Analytics
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Billing & Transactions, Analytics)

**Scope:** Escrow transaction list + detail drill-down, Analytics stat tiles, monthly spend chart,
Top Creators list, Spend by Niche breakdown.

**Definition of Done**
- [ ] Transaction detail links back to the originating Collab Detail.

**Progress Log**
- _(none yet)_

---

## Phase 7 — Campaigns

### 7.1 Campaigns List & Create Campaign
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Campaigns List, Create Campaign)

**Scope:** Campaign list with status segmented filter, Create Campaign with the type toggle
(Brand-Invite vs Open Application) at the top driving genuinely different field sets below it,
split across 2–3 logical form sections.

**Definition of Done**
- [ ] Switching the type toggle mid-form doesn't silently discard already-entered shared fields.
- [ ] Auto-Accept toggle (Open Application) shows its explainer copy.

**Progress Log**
- _(none yet)_

---

### 7.2 Campaign Tracker — Brand-Invite Path
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Campaign Detail/Tracker, Invite Creators to Campaign)

**Scope:** Creators tab (per-creator deal status), Invite Creators screen (Discover reused in
campaign context, client-side duplicate-invite blocking on top of server 409).

**Definition of Done**
- [ ] Already-invited/accepted creators show a disabled state without waiting on a server error.
- [ ] Cancel Campaign shows the deals/escrow-refund impact preview before confirming.

**Progress Log**
- _(none yet)_

---

### 7.3 Campaign Tracker — Open Application Path
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.5 (Campaign Detail/Tracker — Open Application)

**Scope:** Applications tab (pending/approved/declined filter, approve/decline per applicant with
follower range/trust score/engagement/pitch shown), Accepted Creators tab.

**Definition of Done**
- [ ] Approving an application correctly creates a Deal and routes/links into the standard
      lifecycle from `accepted` onward (reuses 4.2+, no separate campaign-deal screen).

**Progress Log**
- _(none yet)_

---

### 7.4 Creator Side — Discover & Apply to Campaigns
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Open Campaigns, Campaign Detail creator view + Apply Sheet, My
Applications)

**Scope:** Open Campaigns discover list (two distinct empty states — none-exist vs
not-eligible-yet), Campaign Detail with requirement met/not-met checks against the creator's own
profile, Apply sheet (package + pitch), My Applications list.

**Definition of Done**
- [ ] Applying immediately removes the campaign from the Discover list via query invalidation.
- [ ] Approved applications link into the resulting Collab Detail.

**Progress Log**
- _(none yet)_

---

## Phase 8 — Shared/Global Polish

### 8.1 Notifications & Deep Linking
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (Notifications), §5, §10 (Push notifications, Deep linking)

**Scope:** Notifications list (type-icon map, mark-read, mark-all-read), Expo push registration
post-onboarding with a pre-permission explainer, deep-link handling for `metadata.dealId`/
`campaignId` taps and for password reset / public profile sharing links.

**Definition of Done**
- [ ] Tapping a push notification routes straight into the relevant Collab/Campaign Detail, app
      cold-start included, not just when already running.

**Progress Log**
- _(none yet)_

---

### 8.2 Settings
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.3 (Settings, Change Password)

**Scope:** Account/Payments/Notifications/Appearance/Support/Legal groups, theme override
(system/light/dark wired to the theme system from 0.2), logout confirm sheet, Change Password.

**Definition of Done**
- [ ] Theme override actually changes rendered theme app-wide, persists across restarts.

**Progress Log**
- _(none yet)_

---

### 8.3 Creator Tools Hub (bonus, low priority)
**Status:** ⬜ Not Started
**Spec refs:** prompt.md §6.4 (Creator Tools Hub)

**Scope:** In-app wrapper for Price Calculator, Fake-Follower Checker, personal Analytics Log,
read-only Brief/Contract template viewers — surfaced from Settings/dashboard, not a dedicated tab.

**Definition of Done**
- [ ] Build only after all core-transaction-flow sprints (0–7) are complete, per spec priority.

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
- [ ] Spot-check every list screen at 150% system font scale without broken layout.
- [ ] Every `StatusBadge`/`TrustBadge` usage confirmed to pair color with text.

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
- [ ] Funnel event list reviewed against §10's exact list, nothing missing.
- [ ] Prod/staging/dev API base URLs confirmed switchable via env config only.

**Progress Log**
- _(none yet)_

---

## Deviations from Spec

Running log of any place the implementation intentionally diverges from `prompt.md` (missing
backend field, ambiguous spec, deliberate scope cut) — so later sprints and the user aren't
surprised by a mismatch. Append as they come up; leave empty otherwise.

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
- **`expo export --platform web` (static SSR) fails** — `expo-secure-store`'s web shim throws
  under Node-side prerendering (`setValueWithKeyAsync is not a function`). Not fixed: web isn't a
  target platform per prompt.md §2 (iOS + Android only). `expo export --platform android/ios` and
  `expo start --web` (dev mode, not static export) both work fine.
- **`react-native-razorpay` not installed yet.** It's native-module-only (no Expo Go support,
  needs a dev build) and isn't used until Sprint 4.3 — deferred rather than installed early and
  left unused.
