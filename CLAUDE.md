# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branding

Shipped as **FindCollab** (renamed from the spec's internal "InfluenceHub" at the user's request,
2026-10-12 — `prompt.md` itself is left unmodified, it's the original spec doc). The name, slug,
scheme, and every in-app string were updated; `app.json`'s `scheme` is `findcollab`, so deep links
are `findcollab://...`.

**Brand mark**: a magnifying glass with two overlapping dots in the lens (Find + Collab — two
parties connecting), white on the brand-purple badge. Generated programmatically via
`scripts/generate-icons.js` (uses `sharp`, a devDependency — never imported by app code, so it
never ships in the bundle). Re-run `node scripts/generate-icons.js` after editing the SVG marks in
that script to regenerate every PNG (`assets/images/icon.png`, `splash-icon.png`, `favicon.png`,
the three Android adaptive-icon layers) plus the iOS 18+ Icon Composer bundle's symbol layer
(`assets/expo.icon/`). **Note**: a custom app icon is only visible in a real build (EAS/dev
client) — Expo Go always shows its own icon on the home screen regardless of `app.json`. The
splash screen *is* visible in Expo Go, since it reads `app.json`'s splash config directly.

**Design system** (light editorial, 2026-10-13 — second pass; replaces the violet-led look and
the darker first neutral pass):
- **Light only.** The app is pinned to the light theme regardless of the device setting:
  `APP_COLOR_SCHEME` in `src/lib/theme.ts`, applied via `colorScheme.set()` at the top of
  `src/app/_layout.tsx` (NativeWind + React Native `Appearance`), plus
  `userInterfaceStyle: "light"` in `app.json`. `useAppTheme` returns the light tokens and does
  not read the OS scheme. The dark token set still exists in `theme.ts`/`global.css` but is
  unused and unpolished — re-enable it only through a deliberate Settings toggle.
- **Palette.** Base `#FAF9F6`, white surfaces, borders `#E8E5DF`, ink `#202020`, secondary text
  `#706F69`, sage accent `#667B62`. **The UI carries no violet** — violet lives only in the
  logo/app icon image. Source of truth is `src/lib/theme.ts`; **keep `src/global.css`'s CSS vars
  and `tailwind.config.js` in sync by hand**, and `app.json`'s splash `backgroundColor` must match
  `bg.base`.
- **Color roles.** `action` (`bg-action`) = primary buttons only. **Selected states are never a
  dark fill**: a chosen chip / segment / card is `border-accent bg-selected` (light sage surface)
  with `primary` text. `accent` (`#667B62`) is for borders, check marks, icons and progress
  fills; it is under 4.5:1 as small text, so text uses `accent-strong` (`Text color="accent"`
  already maps to it). Anything drawn on a filled surface takes `text-inverse` /
  `colors.text.inverse`, never a hardcoded `#FFFFFF`. Focused inputs get `border-ink`. Disabled
  controls are never faded with opacity: a disabled button uses `Text color="disabled"`
  (`text.disabled`, 4.7:1 on the `bg-border` fill). There is no `brand` color token —
  don't reintroduce one.
- **No decoration.** No orbs/washes behind content (`HeroOrb` and `Screen`'s `backdrop` prop were
  removed), no colored glow shadows, no bouncy icon tiles. A standalone "moment" icon (success,
  empty state) is always `components/ui/IconBadge.tsx` — a hairline ring with a thin ink glyph.
  The intro slides' visuals are `components/domain/intro/IntroVignettes.tsx`: stills of the
  product built from real primitives, with no invented creators, counts or prices.
- **Radii:** `sm` 8 (chips), `md` 12 (buttons, inputs, cards), `lg` 20 (sheets), `full`. Don't use
  Tailwind's stock `rounded-xl`/`2xl` (they resolve through rem — see spacing note below).
- **Layout.** Screens use a 24pt gutter (`Screen`'s default) and left-aligned,
  type-led headers (`h1`/`display` + a `secondary` body line). Pushed screens start with
  `components/ui/ScreenHeader.tsx` (44pt back row; it hides its control when there's nothing to
  go back to but keeps its height).
- **`lib/cn.ts` must know every custom font-size name.** tailwind-merge otherwise treats
  `text-h1`, `text-body`, … as text *colors* and drops them when `text-ink` follows (this silently
  removed every font size in the app until fixed). Adding a `fontSize` name to
  `tailwind.config.js` means registering it in `cn.ts` too.
- **Spacing is spelled out in px for every step** in `tailwind.config.js`. NativeWind resolves
  Tailwind's stock rem values at 14px/rem on native, so an unlisted step renders ~12% small. Add
  the px value before using a new step.
- **Type.** Scale: display 34/40, h1 28/34, h2 22/28, h3 17/24, body 16/24, bodySm 14/20,
  caption 12/16. `Text`'s `weight` picks a file within the variant's own family — headings stay
  Manrope (bold or semibold only), body stays Inter. `fontSize` tokens carry no `fontWeight`.
  Button labels are always Inter. Field labels are `bodySm` medium in `primary`.
- **Sizes.** Inputs, date/select fields and `lg` buttons are 52pt (`min-h-13`); `md` buttons 48pt.
- **Motion.** Tokens live in `lib/motion.ts` (`Motion.duration.press/fast/base`,
  `Motion.easing.out`, `Motion.pressScale`, `Motion.stagger`) — no inline durations, no default
  easing, no springs/bounce on things that merely appear. **Screens and their content have no
  entrance animation** (`Screen`'s fade, the wizard's per-step fade and How It Works' stagger were
  removed): content paints with the first frame and the native stack transition is the only
  motion between screens. Don't wrap primary content in a Moti `from={{ opacity: 0 }}`.
  `Button`'s press-scale is a plain `Pressable` + inner `MotiView` (not `MotiPressable`, which
  isn't NativeWind-stylable); keep that inner view content-sized.
- **Touch targets are 44pt** (`MIN_HIT_SIZE`); a smaller visual reaches it with `hitSlop`.
  Controls use `min-h-*`, not `h-*`, so labels can wrap at large system font sizes.
- **Sheets:** pass `scrollable` to `AppBottomSheet` when its children include a
  `BottomSheetFlatList` (it must not sit inside a `BottomSheetView`). The shell handles
  home-indicator padding and Android hardware-back itself; its ref exposes `present`/`dismiss` only.
- **`OtpInput`** is one invisible `TextInput` over display-only boxes (paste + SMS autofill).
- `src/app/_layout.tsx` renders `<StatusBar style="dark" />` to match the pinned light theme.
- `lib/haptics.ts` wraps `expo-haptics`; `lib/toast.ts`'s `success`/`error` fire the matching
  haptic automatically. Call `haptics.*` directly only for non-toast checkpoints (a selection, a
  wizard step advancing) — not on every tap.

**First launch** (2026-10-13): `src/lib/auth/initial-route.ts`'s `resolveInitialRoute()` is the
splash screen's only decision and is unit-tested (`lib/auth/__tests__/initial-route.test.ts`):
session on device → `getPostAuthRoute`; signed out + intro unseen → `/welcome` (three slides);
signed out + intro seen → `/login`; any failure → `/login`. The intro flag
(`lib/local-flags.ts`, AsyncStorage, key suffixed `.v2`) is written **only** by Welcome's Skip /
Get Started, never on open. The splash waits only on a token refresh (capped at 1.5s) and is a
static copy of the native splash so the hand-off is invisible. In dev builds, Coming Soon has a
"Replay intro" button.

**Keyboard handling** (2026-10-12): `Screen`'s `scroll + keyboardAvoiding` combo no longer wraps
the `ScrollView` in a `KeyboardAvoidingView` — on iOS that measures its ancestor's position in the
window to compute padding, and the measurement came back stale while nested inside `Screen`'s
mount-animation `MotiView` (which moves via a transform), under-reserving space so content below
the keyboard was unreachable by scroll. Fixed by giving the `ScrollView` itself
`automaticallyAdjustKeyboardInsets` + `contentInsetAdjustmentBehavior="automatic"` (iOS-native
inset handling, doesn't depend on ancestor measurement) plus `keyboardDismissMode="on-drag"`.
Android needs none of this — it already resizes the window natively on keyboard open.
`KeyboardAvoidingView` is kept only as a fallback for a hypothetical non-scrolling
`keyboardAvoiding` screen (none currently exist). Separately, `Input`'s `onBlur` now calls
`Keyboard.dismiss()` (closes the keyboard the instant focus leaves a field; if another text field
is tapped next, its own `onFocus` reopens it immediately, so this only removes the keyboard when
focus moves somewhere that doesn't need it), and `Select`'s field trigger / brand-profile-setup's
`Switch` dismiss the keyboard before acting, for the same reason. Apply the same `Keyboard.dismiss()`
pattern to any new non-text-input control that can be reached while a field is focused.

## Commands

```bash
npm start          # Metro bundler — press a/i/w, or scan with Expo Go
npm run android
npm run ios
npm run web         # currently crashes — both `expo start --web` and `expo export --platform web`
                    # go through Node-side SSR (app.json's web.output:"static"), and
                    # expo-secure-store's web shim throws under that (`setValueWithKeyAsync is not
                    # a function`). Not a real target platform per prompt.md §2 (iOS + Android
                    # only), so left unfixed. Use `expo export --platform android` (or `--ios`) to
                    # sanity-check that the real bundle compiles; use Expo Go / a simulator for an
                    # actual interactive run.
npm run lint        # eslint . (flat config: eslint-config-expo + eslint-config-prettier)
npm run typecheck   # tsc --noEmit
npm test            # jest (jest-expo preset)
npm run format      # prettier --write .
```

There's no single-test-file shorthand configured — use `npx jest path/to/file.test.ts` directly.

## Repository state

The Expo project is scaffolded and building — **Phase 1 is done and both roles have a home
after onboarding**: creator tab shell + Home + Edit Profile + Packages, and brand tab shell +
Home + Company profile. Every other tab is a `NotBuiltYetTab` placeholder, and nothing past
that (requests, collab detail, discovery, payments, messaging) exists (see `SPRINTS.md`'s Progress Overview for exact status per sprint). There is no real backend yet, so a **mock-mode layer**
(`src/lib/api/mock-mode.ts`) makes the whole flow click-through-testable without one — see
"Mock mode" below before assuming an API call is real. It runs on
**Expo SDK 57** (React 19.2, React Native 0.86, New Architecture, React Compiler enabled) — this
was `npx create-expo-app@latest`'s current default at scaffold time, not a pinned choice; if you
bump the SDK later, re-verify NativeWind/@gorhom/bottom-sheet/moti/react-native-gifted-charts
compatibility first.

**The API reference and the backend source are in the sibling folder `../influencer_backend/`**
(`frontend_prompt.md` is the reference `prompt.md` keeps citing; `src/` and `prisma/schema.prisma`
are the code). **When the two disagree, the backend code wins** — e.g. the dashboard payload in
`frontend_prompt.md` §2 is stale. Read the relevant service/validation file before adding an
endpoint, and don't invent endpoints or payload shapes. Reconciled so far: `lib/api/creator.ts`
(profile read/update, uploads, packages, dashboard), `lib/api/brand.ts` (profile, dashboard)
and `CONTENT_TYPES`. Still marked **PROVISIONAL** and unchecked: `lib/auth/types.ts`,
`lib/api/auth.ts`, and the NICHES / LANGUAGES lists in `lib/constants.ts`. Known backend gaps:
no brand logo upload endpoint, package `DELETE` only deactivates, and optional URL fields
reject `""` (send `null` or omit — see `toProfilePayload` in `lib/api/creator.ts`). See SPRINTS.md's "Deviations from Spec" log.

### Mock mode

Every `src/lib/api/*.ts` function used so far (auth, creator profile, brand profile) branches on
`IS_MOCK_API` from `src/lib/api/mock-mode.ts` (default **on** — no backend to point at yet).
When on, calls resolve with fake data after a short simulated delay instead of hitting `apiClient`,
so the whole app is click-through-testable offline. Practical notes:
- Login accepts any email/password. Google Sign-In skips the real browser redirect entirely.
- Phone OTP verification accepts exactly `888999` (exported as `MOCK_OTP_CODE`) — shown as an
  on-screen hint in mock mode, mirroring prompt.md §6.2's own mention of a fixed dev OTP.
  Anything else throws (so the error-path UI is still exercised).
- Photo/logo "uploads" just resolve with the local file URI, which `expo-image` renders fine.
- Both dashboards mock a brand-new account (nothing earned or spent, no requests, collabs or
  campaigns). `mockCreator` / `mockBrand` keep what the wizard, Edit Profile, Packages and
  Company profile save, in memory, so those screens read back what was entered. **Mocks never seed
  invented deals, brands, amounts or stats** — a screen that needs data to be seen needs the
  real backend.
- Set `EXPO_PUBLIC_MOCK_API=false` once a real backend exists at `EXPO_PUBLIC_API_BASE_URL` to use
  the real network calls instead. **When wiring up a real backend, delete `mock-mode.ts` and every
  `if (IS_MOCK_API)` branch that references it** — don't let it linger as permanent scaffolding.

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
    index.tsx                  # Splash screen — silent refresh attempt, then redirects via getPostAuthRoute
    creator/                    # creator area: _layout (role guard), (tabs)/ home + 4 not-built tabs,
                                # edit-profile.tsx, packages.tsx, package-form.tsx (create, or edit with ?id=)
    brand/                      # brand area: _layout (role guard), (tabs)/ home + 4 not-built tabs,
                                # profile.tsx (company profile; loads GET /brands/me)
    (auth)/                    # login, welcome, forgot-password, reset-password
    (onboarding)/               # guarded (redirects to /login if no session): role-selection, bank-setup,
                                # how-it-works, creator-wizard (7-step, orchestrates components/domain/creator-wizard/*)
  components/
    ui/                        # generic primitives — Button, Input, Text, Screen, Card, Chip, Badge, Avatar,
                                # EmptyState, Skeleton, BottomSheet/ConfirmSheet, Select/MultiSelectField,
                                # SegmentedControl, DateField, OtpInput, StepProgress, toast-config,
                                # GoogleIcon, PasswordChecklist
    domain/
      packages/                  # PackageCard (manage/pick/display — the one package card), PackageForm
                                  # (shared by wizard step 7 and creator/package-form)
      creator/                   # TrustScoreSheet
      dashboard/                 # DashboardParts — StatTile, SectionHeader, SectionNote, NavRow,
                                  # AccountFooter (temporary Log Out), shared by both Home screens
      NotBuiltYetTab.tsx         # honest placeholder body for tabs whose sprint hasn't shipped
      intro/                     # IntroVignettes for the Welcome slides
      creator-wizard/            # Step1Identity..Step7FirstPackage — one file per wizard step, each owns its
                                  # own form + mutation, reads/writes lib/auth/creator-wizard-store.ts
    ErrorBoundary.tsx            # top-level render-crash catch-all, wraps the whole app in _layout.tsx
  hooks/
    use-app-theme.ts            # resolves NativeWind color scheme + raw Colors token object
  lib/
    api/                        # axios instance + interceptors (client.ts), mock-mode.ts (see "Mock mode" above),
                                # one file per resource (auth.ts, creator.ts, brand.ts, ifsc.ts)
    auth/                       # useAuthStore (zustand + secure-store), types.ts (PROVISIONAL — see above),
                                # route-after-auth.ts (shared post-auth routing), onboarding-draft-store.ts
                                # (Role Selection → Bank Setup handoff), creator-wizard-store.ts (all 7 steps'
                                # accumulated data + current step index — both in-memory only, see their doc comments)
    validation/                 # zod schemas mirroring backend rules (auth, onboarding, creator-wizard, brand)
    constants.ts                # NICHES/LANGUAGES/INDIAN_STATES/CONTENT_TYPES shared across wizard + Discover filter
    theme.ts                    # design tokens (Colors/Spacing/Radius/Typography) — kept in sync with global.css's CSS vars
    query-client.ts, toast.ts, cn.ts, local-flags.ts, form-errors.ts
  global.css                   # Tailwind directives + light/dark CSS variables (NativeWind)
```

Path alias `@/*` → `./src/*` (tsconfig). Tailwind color tokens (`bg-base`, `text-ink`,
`text-accent-strong`, `bg-selected`, `bg-money-positive`, `bg-trust-high`, etc., see `tailwind.config.js`) are generated
from the same values as `src/lib/theme.ts`'s `Colors` object — update both together if a token
changes. Dark mode: NativeWind's `useColorScheme` from `nativewind` (wrapped by
`useAppTheme`) toggles the `dark` class; manual override wiring lands in the Settings sprint.

### Root navigation gate logic (`src/app/index.tsx` + `src/lib/auth/route-after-auth.ts`, prompt.md §4)

`getPostAuthRoute(user)` (async — it also checks the local "seen how-it-works" flag) is the single
source of truth for where an authenticated user lands; both the Splash screen and Login's
post-success handlers call it, so the branching can't drift between the two call sites:

1. ~~No token → `(auth)` stack.~~ ✅ done
2. ~~`accountType === null` → `(onboarding)/role-selection`.~~ ✅ done (Sprint 1.2)
3. ~~`accountType` set but `!hasBankAccount` → `(onboarding)/bank-setup` (defensive guard only —
   normally unreachable since `complete-onboarding` sets both atomically).~~ ✅ done (Sprint 1.2)
4. ~~Onboarded but hasn't seen "How It Works" yet → `(onboarding)/how-it-works`.~~ ✅ done (Sprint 1.2)
5. Otherwise → creator: `/creator/home` ✅; brand: `/brand/home` ✅. Incomplete profile is a
   banner nudge on Home, never a hard gate.

Onboarding's own internal step-to-step navigation (role-selection → bank-setup → how-it-works)
does NOT go through `getPostAuthRoute` — it navigates directly, since those are one-time forward
steps, not "where does someone with this persisted state belong" lookups. How It Works ends at
`/brand/home` (brand) or the wizard / `/creator/home` (creator); the wizard finishes with
`router.dismissTo('/creator/home')`.

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
