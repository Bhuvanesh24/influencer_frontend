# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Metro bundler — press a/i/w, or scan with Expo Go
npm run android
npm run ios
npm run web         # works for dev; `expo export --platform web` (static SSR) currently fails —
                    # expo-secure-store's web shim breaks under Node prerendering. Not a real
                    # target platform per prompt.md §2, so left unfixed; use android/ios exports
                    # (`expo export --platform android`) to sanity-check a production bundle.
npm run lint        # eslint . (flat config: eslint-config-expo + eslint-config-prettier)
npm run typecheck   # tsc --noEmit
npm test            # jest (jest-expo preset)
npm run format      # prettier --write .
```

There's no single-test-file shorthand configured — use `npx jest path/to/file.test.ts` directly.

## Repository state

The Expo project is scaffolded and building (Phase 0 foundation + Phase 1.1 Pre-Auth screens are
done — see `SPRINTS.md`'s Progress Overview for exactly what's shipped vs. pending). It runs on
**Expo SDK 57** (React 19.2, React Native 0.86, New Architecture, React Compiler enabled) — this
was `npx create-expo-app@latest`'s current default at scaffold time, not a pinned choice; if you
bump the SDK later, re-verify NativeWind/@gorhom/bottom-sheet/moti/react-native-gifted-charts
compatibility first.

`prompt.md` repeatedly cross-references a companion file, `frontend_prompt.md` (the backend API
reference — endpoints, request/response shapes, enums), which is **not present in this repo**. Where
prompt.md doesn't spell out an exact field name inline, the corresponding API types/functions in
`src/lib/api/` and `src/lib/auth/types.ts` are marked **PROVISIONAL** in a comment — reconcile them
against the real API reference before shipping, and check SPRINTS.md's "Deviations from Spec" log
for anything already flagged. Ask the user for `frontend_prompt.md` rather than inventing new
endpoints or payload shapes when it's needed for a new screen.

**`SPRINTS.md`** breaks the build spec into ordered, trackable sprints with a Definition of Done
and a Progress Log per sprint. When doing implementation work in this repo, work from that file:
check current sprint status in its Progress Overview table, read the sprint's spec references in
`prompt.md` before starting, and append a dated Progress Log entry (and flip the status marker)
whenever you make or finish progress on a sprint.

When starting implementation work here, treat `prompt.md` as the source of truth for product
behavior, screen layout, and conventions — read the relevant section before building a screen rather
than relying on the summary below, which only covers what's needed to orient quickly.

## What's being built

An Expo (React Native + TypeScript) consumer app for an Indian influencer-marketing marketplace,
one codebase covering two permanently-fixed account roles:

- **Brands** discover creators or run campaigns, pay into escrow, review delivered posts, release payment.
- **Creators** list packages, get discovered/invited, deliver posts, get paid via escrow release.

Role is chosen once at onboarding and never toggled — there is no role-switcher, and the entire nav
shell (tab bar, dashboard, terminology) branches once at login based on `accountType`.

### Ground rules that shape almost every screen (prompt.md §1)

- Bank account is mandatory at onboarding for both roles (not deferrable); UPI is optional/secondary.
- Escrow is the trust mechanism — money flows brand → platform → creator, never directly. UI must
  always communicate *where the money currently is*, not just a status word.
- Brands buy **packages** (content type, quantity, price), never a vague flat price. The
  package card/picker is a single reused component across creator packages, brand request flow,
  and campaigns.
- Deal status is a strict state machine: `request_sent → accepted → payment_pending → active →
  post_submitted → verified/auto_approved → completed`, with `rejected / expired / cancelled /
  disputed` off-ramps. Collab Detail is **one** screen with a status-driven body (§6.3), not N
  separate screens — the `DealStatusStepper` component is the core reusable piece.
- Follower counts and similar stats are always **ranges** (`under_1k … range_1m_plus`), never exact
  numbers.
- Creators have a **Trust Score** (`high`/`medium`/`low`, auto-computed, starts at `medium`) — never
  call anything "unverified" (that model was removed). Badge copy: 🟢 Strong Track Record / 🟡
  Building Reputation / 🔴 Caution — See Notes.
- Draft approval (`deal.requiresDraftApproval`) is opt-in per deal, not a platform-wide rule — only
  show the draft-review step in the timeline when that flag is true.
- Brand-Invite campaigns (brand hand-picks creators) and Open-Application campaigns (creators apply,
  brand reviews) are genuinely different screens, not one screen with an if-branch.

## Tech stack (prompt.md §2 — use these choices, don't substitute alternatives)

| Concern | Choice |
|---|---|
| Framework | Expo (React Native) + TypeScript, Expo Router (file-based routing) |
| Styling | NativeWind v4 (Tailwind syntax) + a hand-written `theme.ts` token file |
| Server state | TanStack Query (React Query) — `useInfiniteQuery` for all lists, refetch-on-focus for money/status data |
| Client/auth state | Zustand (`useAuthStore`), persisted via `expo-secure-store` |
| Forms | react-hook-form + zod, validation schemas mirroring the backend's |
| HTTP | axios with request interceptor (bearer token) + response interceptor (401 → silent refresh via `/auth/refresh`, replay once, force logout on second failure) |
| Payments | react-native-razorpay |
| Images | expo-image, expo-image-picker, expo-image-manipulator (crop profile photo to 400×400) |
| Push | expo-notifications, deep-link via `metadata.dealId` |
| Sheets | @gorhom/bottom-sheet |
| Charts | react-native-gifted-charts |
| Icons | lucide-react-native |
| Toasts | react-native-toast-message |
| Skeletons/motion | moti + react-native-reanimated |
| Dates | dayjs |

`react-native-razorpay` isn't installed yet — it's native-module-only (no Expo Go support) and
isn't needed until the Payments sprint (SPRINTS.md 4.3); add it then via a dev build.

### Actual folder structure (adopted from create-expo-app's current default template)

```
src/
  app/                        # Expo Router file-based routes (this is the router root, not repo-root app/)
    _layout.tsx                # root: providers (fonts, safe-area, query client, bottom-sheet, toast) + splash gate
    index.tsx                  # Splash screen — silent refresh attempt, then redirects
    coming-soon.tsx             # temporary landing for any authenticated state with no real screen yet — see its doc comment
    (auth)/                    # login, welcome, forgot-password, reset-password
  components/
    ui/                        # generic primitives — Button, Input, Text, Screen, Card, Chip, Badge, Avatar,
                                # EmptyState, Skeleton, BottomSheet/ConfirmSheet, toast-config, GoogleIcon, PasswordChecklist
    domain/                     # composed screen-specific components (PackageCard, DealStatusStepper, …) — added as each is first needed
  hooks/
    use-app-theme.ts            # resolves NativeWind color scheme + raw Colors token object
  lib/
    api/                        # axios instance + interceptors (client.ts), one file per resource (auth.ts, …)
    auth/                       # useAuthStore (zustand + secure-store), types.ts (PROVISIONAL — see above)
    validation/                 # zod schemas mirroring backend rules
    theme.ts                    # design tokens (Colors/Spacing/Radius/Typography) — kept in sync with global.css's CSS vars
    query-client.ts, toast.ts, cn.ts, local-flags.ts
  global.css                   # Tailwind directives + light/dark CSS variables (NativeWind)
```

Path alias `@/*` → `./src/*` (tsconfig). Tailwind color tokens (`bg-base`, `text-ink`,
`text-brand`, `bg-money-positive`, `bg-trust-high`, etc., see `tailwind.config.js`) are generated
from the same values as `src/lib/theme.ts`'s `Colors` object — update both together if a token
changes. Dark mode: NativeWind's `useColorScheme` from `nativewind` (wrapped by
`useAppTheme`) toggles the `dark` class; manual override wiring lands in the Settings sprint.

### Root navigation gate logic (`src/app/index.tsx` + `src/app/_layout.tsx`, prompt.md §4)

Implemented so far: unauthenticated → `(auth)/welcome` (first launch) or `(auth)/login`.
Authenticated → `/coming-soon` (temporary) until the sprints below exist:

1. ~~No token → `(auth)` stack.~~ ✅ done
2. Token valid but `user.accountType === null` → `(onboarding)` → Role Selection — **Sprint 1.2**.
3. `accountType` set but bank account missing → Bank Setup (defensive guard only) — **Sprint 1.2**.
4. Otherwise → `(creator)` or `(brand)` tab group, permanently, for that account. Incomplete
   profile is a dismissible banner nudge, never a hard gate — **Phase 2/3**.

When building Sprint 1.2+, replace the two `router.replace('/coming-soon')` call sites (in
`(auth)/login.tsx`'s `routeAfterAuth`) with real routes, and extend `index.tsx`'s post-refresh
branch accordingly.

## Global patterns to follow everywhere (prompt.md §5)

- Every list screen: `useInfiniteQuery`, `page/limit` params, pull-to-refresh, footer spinner,
  page size 20.
- Optimistic updates for accept/reject/counter-offer, send message, mark-read, approve/decline —
  update cache immediately, roll back with a toast on failure.
- Refetch-on-focus for anything money/status related, since backend state changes from other
  parties/cron jobs, not just this client's actions.
- One global axios error interceptor maps `{ success:false, message, code, errors }` to a toast;
  screens needing inline field errors intercept 422/400 and map `errors[]` via
  `setError` (react-hook-form).
- Money amounts from the API are strings (Decimal) — `Number()` before formatting; never
  recompute fee math client-side, always render server-provided `fee-breakdown`.
- Empty / loading / error are three distinct states — never conflate "no data yet" with "loading."

## Where to look in prompt.md for details

- §3 — full design token tables (color, type, spacing) and the core reusable component list.
- §6 — screen-by-screen specs (pre-auth, onboarding, shared/global, creator screens, brand screens).
- §7 — end-to-end flow walkthroughs (signup, direct collab lifecycle, both campaign types) — useful
  for understanding how screens connect before building any single one.
- §8 — detailed prop/behavior specs for the critical composite components (`DealStatusStepper`,
  `TrustBadge`, `PackageCard`, `CampaignCard`, `ChatBubble`, `CountdownChip`).
- §9 — copy/microcopy tone rules (money language, empty states, error surfacing, irreversible-action
  confirmations).
- §10 — non-functional requirements (offline caching, accessibility, performance, deep linking,
  analytics event naming, configurable API base URL).
- §11 — a condensed paste-ready prompt summarizing the whole spec, useful as a sanity check that an
  implementation isn't drifting from it.

Build order should follow the dependency order implied by §6/§7 (shared primitives and auth/
onboarding first, since later screens reuse components those establish), not the top-to-bottom
reading order of the spec.
