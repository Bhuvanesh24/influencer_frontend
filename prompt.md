# InfluenceHub — React Native App: Full Frontend Build Spec

This is the companion document to `frontend_prompt.md` (the API reference). That file tells an
AI coder *what the backend does*. This file tells it *what to build on top of it* — every screen,
its layout, its states, which endpoints feed it, and how the whole thing flows from signup to
daily use. Hand both files to the coding AI together.

**Scope:** the consumer app only (Brand side + Creator side, one codebase, role-branched
navigation). The Admin Panel (`frontend_prompt.md` §19) is a separate internal tool — typically a
web dashboard, not part of this mobile app — and is out of scope here except where noted.

---

## 0. How To Use This Document

1. Read §1–§5 first (product rules, stack, design system, navigation map, global patterns) —
   these constrain every screen that follows.
2. §6 is the screen-by-screen spec. Build in the order given in §7 (Build Order), not the order
   listed in §6 — §6 is organized for reading, §7 for building, since some screens depend on
   components/patterns established by earlier ones.
3. Every screen spec references exact endpoints from `frontend_prompt.md` — cross-check field
   names and enums there before wiring a screen; this doc doesn't repeat full request/response
   shapes.
4. §11 is a single paste-ready prompt that summarizes this whole document if you want to hand an
   AI agent one message to kick off the build.

---

## 1. Product Snapshot & Ground Rules

InfluenceHub connects Indian brands and Indian Instagram/YouTube creators. Brands discover
creators (or run campaigns), pay into escrow, creators deliver and post, brands verify, escrow
releases to a creator payout. A few rules shape the whole UI:

| Rule | UI Consequence |
|---|---|
| **One role per account, permanent.** Brand or Creator, chosen once at onboarding, never toggled. | No role-switcher anywhere in the app. The entire nav shell (tab bar, dashboard, terminology) branches once at login and never changes for that account. |
| **Bank account is mandatory at onboarding**, for both roles. | Onboarding cannot complete without valid bank details — this is not a "skip for later" step (UPI is optional/secondary; bank is the required primary). |
| **Escrow is the trust mechanism.** Money moves brand → platform → creator, never directly. | Every collab screen should visually communicate *where the money is right now* (not yet paid / held safely / released), not just a status word. |
| **Packages, not flat prices.** Brands always buy a specific package (content type, quantity, price), never a vague "reel." | The package card/picker is a first-class, reused component (creator packages page, brand request flow, campaign creation, campaign invite). |
| **Deal status is a strict state machine** (`request_sent → accepted → payment_pending → active → post_submitted → verified/auto_approved → completed`, with `rejected / expired / cancelled / disputed` off-ramps). | The Collab Detail screen is one screen with a status-driven body, not N different screens. A status stepper/timeline is a core reusable component. |
| **Follower counts are ranges, not exact numbers** (`under_1k … range_1m_plus`), same for engagement-adjacent stats. | Never render a raw follower count as if exact. Always show the range chip. |
| **Trust Score (high/medium/low), not "Verified/Unverified."** Auto-computed from platform activity; every creator starts at `medium`. | Badge language: 🟢 "Strong Track Record" / 🟡 "Building Reputation" / 🔴 "Caution — See Notes." Never say "unverified" — that model was removed. |
| **Draft approval is opt-in per deal** (`requiresDraftApproval`), not a fixed platform rule. | The draft-review step in the Collab Detail timeline only appears when `deal.requiresDraftApproval === true`; otherwise the flow skips straight from `active` to post submission. |
| **Two campaign types with different mental models.** Brand-Invite = brand hand-picks; Open Application = creators apply, brand reviews. | These are genuinely different screens on the brand side (invite flow vs. applicant review), not one screen with an if-branch. |

---

## 2. Tech Stack & Project Setup

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo (React Native) + TypeScript**, Expo Router (file-based routing) | Single codebase for iOS + Android, OTA updates, built-in deep-link handling for notification taps and password-reset links. |
| Styling | **NativeWind v4** (Tailwind syntax for RN) on top of a hand-written `theme.ts` token file | Fast to write, keeps the design system in one place, easy for an AI coder to stay consistent. |
| Server state | **TanStack Query (React Query)** | Caching, pagination, refetch-on-focus (needed for payout status, deal status, notifications), optimistic updates for accept/reject/message send. |
| Client/auth state | **Zustand** (`useAuthStore`) | Access/refresh token, current user, account type, onboarding status. Persisted via `expo-secure-store`. |
| Forms | **react-hook-form + zod** | Validation rules mirror the backend's zod schemas (char limits, enums) — define them once in a shared `validation/` folder. |
| HTTP client | **axios** with a request interceptor (attach bearer token) and a response interceptor (on 401 → silent refresh via `/auth/refresh`, replay original request; on second failure → force logout) | Matches the 15-min access / 30-day refresh token lifecycle. |
| Secure storage | **expo-secure-store** | Tokens never touch AsyncStorage in plaintext. |
| Payments | **react-native-razorpay** | Native checkout sheet for the `create-order` → SDK → `lock-escrow` flow. |
| Images | **expo-image** (display, caching) + **expo-image-picker** + **expo-image-manipulator** (crop profile photo to 400×400) | |
| Push notifications | **expo-notifications** | Register device token, deep-link a tapped notification straight to the relevant Collab Detail / Chat Thread using `metadata.dealId`. |
| Bottom sheets | **@gorhom/bottom-sheet** | Filters, package create/edit, payout account add, review modal — anything that shouldn't be a full-screen push. |
| Charts | **react-native-gifted-charts** | Monthly earnings (creator wallet), monthly spend (brand analytics). |
| Icons | **lucide-react-native** | Consistent line-icon set, large coverage. |
| Toasts | **react-native-toast-message** | Global success/error feedback, non-blocking. |
| Skeletons | **moti** (+ `react-native-reanimated`) | Skeleton loaders and micro-interactions (status change pulses, button press states). |
| Dates | **dayjs** with relative-time plugin | "2h left," "3 days ago," deadline countdowns. |

### Suggested Folder Structure

```
app/                        # Expo Router file-based routes
  (auth)/                   # pre-auth stack: login, forgot-password, reset-password
  (onboarding)/              # role select, bank setup, profile wizard (creator/brand)
  (creator)/                 # creator tab group
    (tabs)/
      home.tsx  discover.tsx  collabs.tsx  wallet.tsx  inbox.tsx
    collab/[id].tsx  packages/  wizard/
  (brand)/                   # brand tab group
    (tabs)/
      home.tsx  discover.tsx  collabs.tsx  campaigns.tsx  inbox.tsx
    collab/[id].tsx  campaign/[id].tsx  creator/[id].tsx
  _layout.tsx                # root: auth gate + role gate
components/
  ui/                        # Button, Input, Select, Chip, Badge, Card, Avatar, Modal, Toast...
  domain/                    # PackageCard, DealStatusStepper, TrustBadge, CampaignCard, ChatBubble...
lib/
  api/                       # axios instance + one file per resource (auth.ts, collabs.ts, wallet.ts...)
  auth/                      # useAuthStore, token refresh logic
  validation/                # zod schemas mirroring backend
  theme.ts
hooks/                       # useDeal(), usePayoutMethods(), useNotifications()...
```

---

## 3. Design System

**Tone:** trustworthy fintech-meets-creator-economy. Clean, generous whitespace, confident type,
one accent color used sparingly (for primary actions + money-positive states), no gradients or
skeuomorphism. Think Razorpay/Cred-level polish crossed with Collabstr's creator-marketplace
warmth — never cluttered, never playful-to-the-point-of-unserious (real money moves through
this app).

### 3.1 Color Tokens

Define both light and dark palettes; default to system theme with a manual override in Settings.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg.base` | `#FAFAFA` | `#0B0D10` | Screen background |
| `bg.surface` | `#FFFFFF` | `#15181D` | Cards, sheets |
| `bg.surfaceRaised` | `#FFFFFF` + shadow | `#1C2026` | Modals, floating elements |
| `border.subtle` | `#E9EAEC` | `#262B33` | Card borders, dividers |
| `text.primary` | `#101317` | `#F2F3F5` | Headings, body |
| `text.secondary` | `#5B6270` | `#9BA1AD` | Meta text, labels |
| `text.muted` | `#9BA1AD` | `#5B6270` | Placeholders, disabled |
| `brand.primary` | `#5B4FE8` (indigo-violet) | `#8A7FFF` | Primary buttons, active tab, links |
| `brand.primaryPress` | `#4A3FD1` | `#7A6FEE` | Pressed state |
| `money.positive` | `#12875A` (green) | `#3DDC97` | Earnings, "Paid," escrow-released |
| `money.held` | `#B7791F` (amber) | `#F0B94E` | Escrow held, pending payout |
| `status.danger` | `#D64545` | `#F27171` | Rejected, disputed, errors |
| `status.info` | `#2E6FE8` | `#6B9CFF` | New/informational badges |
| `trust.high` | `#12875A` | same | 🟢 badge |
| `trust.medium` | `#B7791F` | same | 🟡 badge |
| `trust.low` | `#D64545` | same | 🔴 badge |

### 3.2 Typography

- Font: **Manrope** (headings) + **Inter** (body/UI) — both free, geometric-humanist, read well
  at small sizes on mobile. Load via `expo-font`.
- Scale: `display` 32/40 · `h1` 24/32 · `h2` 20/28 · `h3` 17/24 · `body` 15/22 · `bodySm` 13/18 ·
  `caption` 11/16. Weights: 700 for headings/amounts, 600 for labels/buttons, 400/500 for body.
- Currency amounts always render in a **tabular-nums** numeric style so lists of ₹ values align.

### 3.3 Spacing, Radius, Elevation

- 4pt base spacing scale: 4/8/12/16/20/24/32/40/48.
- Radius: `sm` 8 (chips, inputs) · `md` 12 (cards) · `lg` 20 (sheets, modals) · `full` (avatars,
  pill badges).
- Shadows: single soft elevation on light mode (`0 2px 8px rgba(16,19,23,0.06)`), border-only on
  dark mode (no shadow) — flat, no double elevation stacking.

### 3.4 Core Components (build these first, reuse everywhere)

| Component | Variants / Notes |
|---|---|
| `Button` | `primary` (filled brand), `secondary` (outline), `ghost` (text-only), `danger`. Sizes `sm/md/lg`. Always has a `loading` prop that swaps label for a spinner without changing button width. |
| `Input` / `TextArea` | Label above, helper/error text below, live character counter for length-capped fields (bio 300, brief 5000, etc.), leading icon slot. |
| `Select` / `MultiSelect` | Opens a bottom sheet with search (niches, languages, states). Selected items render as removable chips under the field. |
| `Chip` / `Tag` | Static (niche tag on a card) and `selectable` (filter chip, toggles active state) variants. |
| `Badge` | `TrustBadge` (colored dot + label per §3.1), `StatusBadge` (deal/payout/dispute status → color + label map, one source of truth object), `FollowerRangeBadge`. |
| `Avatar` | Circular, fallback = initials on a deterministic color, small ring for "online"/"available" state on creator avatars. |
| `Card` | `CreatorCard`, `PackageCard`, `DealCard`, `CampaignCard`, `TransactionRow` all built on one base `Card` primitive (padding, radius, border, press feedback). |
| `EmptyState` | Illustration slot (use simple line-icon, not stock art) + headline + subtext + optional CTA button. Every list screen defines its own copy (see §9). |
| `Skeleton` | List-row skeleton, card-grid skeleton, detail-page skeleton — shown for the first fetch only, never on refetch (use subtle top progress bar for refetch instead). |
| `BottomSheet` wrappers | `FilterSheet`, `ActionSheet` (accept/reject/counter/report), `ConfirmSheet` (destructive confirmations: delete package, cancel campaign). |
| `Toast` | Success (green check), Error (red, with a "Retry" action when the failure was a network call), Info. |
| `StatusStepper` | Horizontal (compact card) and vertical (detail page) variants of the deal-lifecycle timeline. Data-driven off a status→step-index map. |
| `CountdownChip` | "Auto-approves in 14h," "Applications close in 2d" — recalculates client-side off an ISO timestamp, switches to urgent color under 6h. |
| `MoneyText` | Formats Decimal-as-string amounts from the API consistently (`₹4,500`), with a `tone` prop (`neutral/positive/held`). |

---

## 4. App Information Architecture (Navigation Map)

```
Root
├─ (auth) stack                         [unauthenticated]
│   ├─ Splash
│   ├─ Welcome carousel (first run only, skippable)
│   ├─ Login
│   ├─ Forgot Password
│   └─ Reset Password (deep link)
│
├─ (onboarding) stack                   [authenticated, accountType === null OR profile incomplete]
│   ├─ Role Selection
│   ├─ Bank & Payout Setup               → calls /auth/complete-onboarding, unlocks main app
│   ├─ Welcome / How-it-works (role-specific)
│   └─ Profile Setup Wizard              [soft-gated, see §6.2 — can be deferred, revisited from Settings]
│       ├─ Creator: Identity → Location → Languages/Niches → Socials → Photos → Phone OTP → First Package
│       └─ Brand: Company Info
│
├─ (creator) tab group                  [accountType === 'creator']
│   ├─ Tab: Home            → Creator Dashboard
│   ├─ Tab: Discover        → Open Campaigns list
│   ├─ Tab: Collabs         → My Collabs (segmented: Requests / Active / Past)
│   ├─ Tab: Wallet          → Earnings summary + history
│   ├─ Tab: Inbox           → Conversations list
│   └─ Stacked (pushed, not tabs): Collab Detail, Chat Thread, Edit Profile, Packages,
│       Stats Submission, Campaign Detail, Payout Accounts, Settings, Notifications
│
├─ (brand) tab group                    [accountType === 'brand']
│   ├─ Tab: Home            → Brand Dashboard
│   ├─ Tab: Discover        → Creator search/filter grid
│   ├─ Tab: Collabs         → My Collabs (segmented: Direct / Campaigns)
│   ├─ Tab: Campaigns       → Campaign list
│   ├─ Tab: Inbox           → Conversations list
│   └─ Stacked: Collab Detail, Creator Profile Detail, Send Request, Saved Lists,
│       Campaign Detail, Create Campaign, Billing, Analytics, Settings, Notifications
│
└─ Shared modals/sheets (available from either tree)
    Filter Sheet · Review Modal · Report Message Sheet · Confirm Sheet · Razorpay Checkout
```

**Tab bar icons:** Home (house), Discover (compass/search), Collabs (handshake), Wallet
(wallet — creator only), Campaigns (megaphone — brand only), Inbox (message-circle, with unread
count badge from `GET /notifications` unread + `GET /messages/conversations` unread sum).

**Root gate logic** (`app/_layout.tsx`):
1. No token → `(auth)`.
2. Token valid, `user.accountType === null` → `(onboarding)` → Role Selection.
3. `accountType` set but bank account missing (shouldn't happen since it's required atomically,
   but guard anyway) → Bank Setup.
4. Otherwise → `(creator)` or `(brand)` tab group. A profile-completeness banner (not a hard gate)
   nudges the user back into the wizard if it was skipped — see §6.2.

---

## 5. Global Patterns

- **Pagination:** every list screen uses `useInfiniteQuery`, `page/limit` params, pull-to-refresh
  at the top, and a footer spinner while fetching the next page. Standard page size 20.
- **Optimistic actions:** accept/reject/counter-offer, send message, mark notification read,
  approve/decline application — update the cache immediately, roll back with a toast on failure.
- **Refetch-on-focus** for anything money- or status-related (wallet summary, deal detail, payout
  list) since backend state changes are driven by other parties/cron jobs, not push events the
  client can rely on for every transition — see `frontend_prompt.md` §18 "Refresh" note.
- **Deep links / notification taps:** every push notification carries `metadata.dealId` (or
  `campaignId`) — tapping it should route straight to that Collab/Campaign Detail screen, not just
  open the app.
- **Error handling:** one global axios error interceptor maps the `{ success:false, message,
  code, errors }` shape to a toast by default; screens that need inline field errors intercept
  `422`/`400` locally and map `errors[]` onto form fields via react-hook-form's `setError`.
- **Session expiry:** silent refresh on 401 once; if refresh itself 401s, clear the store and pop
  to Login with a "Session expired, please log in again" toast — never a blank/frozen screen.
- **Money formatting:** all amounts from the API are strings (Decimal) — always `Number()` before
  formatting; never do float math on money client-side beyond display formatting (fee math is
  server-computed and should be rendered from `fee-breakdown`, not recalculated in the app).
- **Empty vs. loading vs. error** are three distinct states for every data screen — never
  conflate "no data yet" with "still loading."

---

## 6. Screen Specifications

### 6.1 Pre-Auth

**Splash**
Brand mark, centered, on `bg.base`. Auto-advances after checking secure-store for a token
(silent `/auth/refresh` attempt if a refresh token exists) — max 1.5s, no user interaction.

**Welcome Carousel** *(first launch only, `AsyncStorage` flag to never show again)*
3 full-bleed slides, swipeable, dot indicator, skippable at any point: (1) "Find real Indian
creators / brands — no agencies, no WhatsApp," (2) "Money held safe in escrow until the post is
live," (3) "Get paid automatically once verified." Final slide's CTA replaces dots with
`Get Started` → Login.

**Login**
- Single screen, no separate "Sign Up" — the backend auto-creates the account on first
  email/password login (`POST /auth/login`), so the form is identical for new and returning
  users. Copy under the button: *"New here? Just enter your details — we'll set you up."*
- Fields: email, password (with show/hide toggle). Primary button `Continue`.
- Divider `or`, then `Continue with Google` (full-width, Google-branded per their guidelines) →
  `GET /auth/google/url` → open in-app browser (expo-web-browser) → intercept redirect →
  `POST /auth/google/callback`.
- `Forgot password?` link under the password field.
- On success: if `user.accountType === null` → onboarding; else → role's tab group.
- Inline validation: password min 8 chars + 1 digit (mirror backend rule) shown as a live
  checklist under the field only while focused, not as a blocking error until submit.

**Forgot Password**
Single email field, `Send Reset Link` button → `POST /auth/forgot-password`. Always shows the
same success message regardless of whether the email exists (anti-enumeration — don't leak this
in the UI either) — *"If that email is registered, a reset link is on its way."*

**Reset Password**
Reached via deep link (`influencehub://reset-password?token=...`). Fields: new password, confirm
password (must match, live indicator). Submits `POST /auth/reset-password`. On success, route to
Login with a success toast, not an auto-login.

---

### 6.2 Onboarding

**Role Selection**
- Full-screen, two large tappable cards side by side (or stacked on narrow screens): **"I'm a
  Brand"** (megaphone icon, *"Find creators, run campaigns, pay securely"*) and **"I'm a
  Creator"** (camera/spark icon, *"List your packages, get discovered, get paid"*).
- Below both cards, a single-line permanence warning: *"This choice is permanent for this
  account. To use both, create two accounts with different emails."* Not a scary modal — just
  quiet, visible text, because this is a real product constraint (§1) and surprising a user with
  it later would be worse.
- Selecting a card highlights it and reveals a `displayName` text field (used in
  `complete-onboarding`) and a `Continue` button.

**Bank & Payout Setup**
- Explain-first layout: a short banner — *"Required to receive payouts / process refunds
  securely."* — before the form, since asking for bank details cold feels risky to users.
- Fields: Account Holder Name, Account Number, Confirm Account Number (must match, paste-blocked
  on the confirm field to force manual re-entry — standard fintech pattern to catch typos), IFSC
  Code (auto-uppercase, live-format-validated against `^[A-Z]{4}0[A-Z0-9]{6}$`), Bank Name
  (auto-filled from IFSC lookup if you wire a free IFSC API, else manual text).
- Optional collapsed section: `+ Add UPI ID as well` → single UPI ID field.
- `Finish Setup` → single call to `POST /auth/complete-onboarding` with `accountType`,
  `displayName`, `bankAccount`, optional `upiId`. On 422 (invalid IFSC etc.), surface field-level
  errors inline, keep the user on this screen — this call is the one true onboarding gate, so
  failure must be recoverable without losing entered data.
- On success: tokens refresh (carry account type now) → route to the "How it works" screen.

**How It Works (role-specific, one-time)**
- **Brand:** exact 3-step-card explainer from the BRD (find & brief → chat & escrow → review &
  release), matching the backend's onboarding copy intent. CTA: `Start Discovering` → Brand
  Discover tab (skips the rest of profile setup — brand profile completion is optional/deferred,
  reachable later from Settings).
- **Creator:** short welcome (*"You're in! Let's get your profile ready so brands can find
  you."*) → CTA `Set Up My Profile` → launches the Profile Setup Wizard. A `Skip for now` ghost
  button is present but the app should make finishing feel worthwhile, not required — land on
  Home with a persistent **profile-completeness banner** (see below) rather than blocking access.

**Creator Profile Setup Wizard**
A single flow, multi-step, progress dots/bar at top (7 steps), each step's `Back`/`Next`, data
persisted per-step so leaving mid-wizard and resuming later doesn't lose progress (call the
relevant PUT/POST per step rather than batching everything into one final submit — matches how
the backend actually separates these concerns across endpoints).

| Step | Fields | Endpoint | Notes |
|---|---|---|---|
| 1. Identity | `creatorTitle` (60 char, live counter), `bio` (300 char, live counter, textarea), `gender` (segmented control: Male/Female/Non-binary/Prefer not to say), `dateOfBirth` (date picker, must be 16+, "not shown publicly" helper text) | `PUT /creators/me/profile` | |
| 2. Location | `country` (default India), `state` (searchable select), `district`, `city` (free text) | same | |
| 3. Languages & Niches | Languages: multi-select chips. Niches: multi-select, **max 5**, counter shows "3/5 selected," 6th tap disabled with a toast | same | Standardised lists — hardcode the 20-niche / 12-language sets from the BRD as constants shared with the Discover filter. |
| 4. Social Accounts | Instagram handle (text, `@` prefix shown as a fixed prefix not typed), Instagram follower range (select, the 7-band enum), YouTube channel URL (optional), YouTube subscriber range (optional select), Featured Reel URL (optional) | same | Helper text under follower range: *"We use ranges, not exact numbers — this protects your privacy and can't be gamed."* |
| 5. Photos | Profile photo (single, required, crop-to-square 400×400 via image-manipulator before upload), Cover photos (up to 3, grid picker with remove-x on each thumbnail) | `POST /creators/me/profile-photo`, `POST /creators/me/cover-photos` | Upload progress bar per image; allow retry on a failed individual upload without restarting the batch. |
| 6. Phone Verification | Phone number input (+91 fixed prefix) → `Send OTP` → 6-digit OTP input (auto-advance boxes) → `Verify` | `POST /auth/phone/send-otp`, `POST /auth/phone/verify-otp` | Resend link disabled with a 30s countdown after send. Dev builds may show a hint that `888999` works pre-launch. |
| 7. First Package | A simplified inline version of the Package create form (§6.4) — title, content type, quantity, price, optional description — framed as *"Add your first package to start receiving requests"* | `POST /creators/me/packages` | Skippable — but skipping shows a stronger nudge on Home than skipping earlier steps, since zero packages means zero bookability. |

Final step ends with a success screen (confetti-lite micro-animation, tasteful not gimmicky) →
Creator Home.

**Profile-completeness banner** (Creator Home, dismissible per-session but reappears next app
open until 100%): a slim progress bar card — *"Your profile is 60% complete — finish it to start
getting collab requests"* — tapping it resumes the wizard at the first incomplete step. Compute
completeness client-side from `GET /creators/me` field presence (has photo, has ≥1 niche, has
≥1 package, phone verified) — this is a UX nicety, not something the backend needs to calculate.

**Brand Profile Setup (Company Info)**
Reachable from Settings, not force-shown (brand onboarding is intentionally fast per the BRD).
Fields map 1:1 to `PUT /brands/me/profile`: Company Name, Website, Industry (select, same niche
list as creators), Description (150 char), Logo upload, Country, Phone, GSTIN (optional, India
tax ID, monospace input). A completeness nudge on Brand Home mirrors the creator one but is
lighter-touch (brands can fully function with just the mandatory onboarding fields).

---

### 6.3 Shared / Global (post-auth)

**Home Tab Router** — not a real screen, just routes to Creator Dashboard or Brand Dashboard
based on `accountType` from the auth store.

**Notifications**
Flat list, newest first, from `GET /notifications`. Each row: type-icon (map `notification.type`
to an icon — request/payment/post/payout/dispute each get a distinct glyph and tint), title,
body (2-line clamp), relative time, unread = subtle left accent bar + slightly bolder text.
Tapping marks read (`PUT /notifications/:id/read`) and deep-links via `metadata.dealId` to
Collab Detail (or campaign/message equivalent). Header action `Mark all read`
(`PUT /notifications/read-all`). Pull to refresh. Empty state: *"You're all caught up."*

**Messages — Conversations List**
`GET /messages/conversations`. Each row: other party's avatar + name, last message preview
(1-line clamp, italicized if it's a system/attachment placeholder like "📎 Photo"), relative
timestamp, unread-count pill. Sorted by most recent activity (backend order). Tap → Chat Thread.
Empty state: *"No conversations yet. Chats open automatically once a collab payment is locked in
escrow."* — this teaches the escrow-gating rule at the exact moment it's relevant.

**Chat Thread**
`GET /messages/conversations/:dealId`. Standard chat UI: bubbles right-aligned for "me," left for
the other party, timestamp on long-press, read-receipt tick under my own latest message. Composer
at bottom: text input (5000 char cap) + attachment icon (image/video/pdf, uploads via
`POST /messages/:messageId/attachments` — send the text first per the API note, then attach) +
send button. Long-press any message → `Report` action sheet
(`POST /messages/:messageId/report`, reasons: harassment/abuse/off_platform).
- **Header** shows the linked deal's package title + a tappable chip that jumps to Collab Detail
  — chat always exists *because of* a deal, never standalone, so that context should be one tap
  away at all times.
- If the deal's chat is not open yet (no escrow lock) don't show this thread as reachable at all
  — it simply won't appear in the conversations list per the empty-state copy above.

**My Collabs (list shell, both roles)**
Segmented control at top switches filters (Creator: *Requests / Active / Past* mapping to status
groups `request_sent`+`accepted` / `payment_pending`+`active`+`post_submitted` /
`completed`+`rejected`+`expired`+`cancelled`+`disputed`. Brand: *Direct / Campaign* — filter by
whether `deal.campaignId` is null). Each row = `DealCard`: counterpart avatar+name, package
title + content-type icon, `MoneyText` amount, `StatusBadge`, and for time-sensitive statuses a
`CountdownChip` (accept-by, verify-by). Tap → Collab Detail. `GET /collabs?status=&page=`.

**Collab Detail** *(the most important screen in the app — the whole deal lifecycle lives here)*
Single scrollable screen, header shows counterpart identity + package + `StatusBadge`. Body is a
vertical `StatusStepper` (Requested → Accepted → Paid/Escrow → [Draft, if
`requiresDraftApproval`] → Posted → Verified → Completed, with a distinct red branch for
Rejected/Expired/Cancelled/Disputed) followed by **one primary action card** whose content is
entirely determined by `(status, viewer role)`:

| Status | Creator sees | Brand sees |
|---|---|---|
| `request_sent` | Brief, offered amount, deadline, `Accept` / `Reject` / `Counter-offer` buttons | "Waiting for creator to respond" + time-left chip |
| `accepted` (creator countered, awaiting brand) | "Waiting for brand" | Counter amount shown, `Accept Counter` / `Reject Counter` |
| `accepted` (ready for payment) | "Waiting for brand to lock payment" | `Pay Now` → fee breakdown preview (`GET /collabs/:id/fee-breakdown`) → Razorpay checkout flow (§6.6) |
| `payment_pending`/`active`, no draft required yet OR draft approved | Creator: `Submit Post` form (postUrl, platform, optional screenshot) | Brand: "In progress, deadline {date}" |
| `active`, `requiresDraftApproval` and no approved draft | Creator: `Submit Draft` (file upload, shows round number) | Brand: pending draft(s) with `Approve` / `Request Changes` |
| `post_submitted` | "Submitted — waiting for verification" + countdown to 48h auto-approve | Post link (opens in browser), screenshot (pinch-zoom viewer), `Verify & Release Payment` / `Raise Dispute` — both buttons prominent, above the fold |
| `verified`/`auto_approved`/`completed` | Payout summary card (amount, fee, net), if not yet reviewed: prompt to leave a review | Receipt card, link to live post, prompt to review the creator |
| `disputed` | Dispute details, evidence, status | Same, plus note that Trust & Safety is reviewing |
| `rejected`/`expired`/`cancelled` | Reason, refund confirmation if applicable | Same |

Below the action card: collapsible **Brief & Details** section (package, brief text, reference
materials as tappable link chips, brand notes), then a **Fee Breakdown** card (always visible
once available — transparency is a stated product value), then a floating `Open Chat` button
pinned to bottom when chat is OPEN for this deal.

**Review & Rating Modal**
Triggered from the completed-state action card. Star picker (1–5, large tap targets), optional
comment (1000 char). `POST /collabs/:dealId/review`. One-time — if `GET /collabs/:dealId/review`
already returns a review from this user, show it read-only instead of the form.

**Dispute Screen**
Brand-only entry point from `post_submitted`. Reason category chips + free-text reason (10–2000
char) + evidence: attach screenshots/links (`evidenceUrls`). Confirm sheet before submitting —
this is a serious, hard-to-reverse action for the collab. `POST /collabs/:id/dispute`.

**Settings**
Grouped list: Account (edit profile → role-specific screen, change password, phone/email shown
read-only), Payments (creator: Payout Accounts; brand: Billing), Notifications (push toggle),
Appearance (theme: system/light/dark), Support (help center link, contact), Legal (terms,
privacy), `Log Out` (confirm sheet), account deletion request if applicable. App version footer.

**Change Password**
Current password, new password, confirm — same live validation as reset password.
`POST /auth/change-password`.

---

### 6.4 Creator Screens

**Creator Dashboard (Home)**
`GET /creators/me/dashboard`. Layout top to bottom:
1. Greeting header with avatar + availability toggle (`isAvailable`, instant-save switch, top
   right — this is the single most important control for a creator, surface it, don't bury it in
   Settings).
2. Profile-completeness banner (if incomplete, per §6.2).
3. Stat row (3–4 `StatTile`s): Total Earnings, Active Deals, Pending Requests, Trust Score
   (tappable → explains the trust score system in a bottom sheet, since it's a new/unfamiliar
   mechanic worth teaching).
4. **Incoming Requests** horizontal card carousel (top 3, "See all →" to full list) — this is the
   action-required section and should be the most visually prominent after the stat row.
5. **Active Collabs** list preview (top 3) with deadline countdown chips.
6. **Recommended Open Campaigns** preview (2–3 cards) linking to the Discover tab.
Pull to refresh re-fetches everything.

**Edit Creator Profile**
Same field groups as the wizard (§6.2), but as a single editable screen with section headers
instead of steps — no progress bar, just a `Save` button per section or one global save with a
dirty-state indicator. Includes the availability toggle and a live preview button
(`Preview as brands see it →` opens the public Creator Profile Detail screen read-only).

**Packages List**
Grid or list of `PackageCard`s (title, content-type icon, quantity, price, active/inactive
toggle, edit/delete overflow menu). Floating `+ Add Package` button. Empty state: *"No packages
yet — brands can't book you until you add one."* `GET /creators/me/packages`.

**Create/Edit Package Sheet**
Bottom sheet: Title, Content Type (icon-grid select: Reel/Post/Story/YouTube Video/Shorts/
Live/UGC Video/UGC Photo), Quantity (stepper), Price (₹ input with a live "recommended range"
hint pulled from `/tools/price-calculator` using the creator's own follower range + niches —
show as *"Similar creators charge ₹X–₹Y for this"*), Description (optional, 1000 char),
Inclusions (chip-add free text list), Platform (Instagram/YouTube/Both). `Save` disabled until
required fields valid. `POST` / `PUT /creators/me/packages/:id`. Delete via overflow → confirm
sheet → `DELETE`.

**Stats Submission (Verification)**
A secondary, optional screen (reachable from Settings → "Boost your credibility") — since Trust
Score is now auto-computed and this isn't a hard gate, frame it as supplementary evidence, not a
requirement. Form: handle, follower count, engagement rate, avg likes/comments, YouTube fields,
two screenshot upload slots. `POST /creators/me/stats/submit` (multipart). Show current
submission status if one exists (`GET /creators/me/stats`).

**Incoming Requests**
Filtered list (`status=request_sent`) of `DealCard`s with `Accept`/`Reject` quick-actions
directly on the card (swipe actions or inline buttons) in addition to tap-through to full detail
for `Counter-offer`. Sort by soonest-expiring first (24h response window).

**Request Detail (Accept/Reject/Counter)**
This is the Collab Detail screen at `request_sent` status (§6.3) — not a separate screen. The
counter-offer flow: tapping `Counter-offer` opens a sheet with an amount input, pre-filled with
the offered amount, helper text noting *"Max 2 rounds of negotiation."* `POST
/collabs/:id/counter-offer`.

**Submit Post**
Reached from Collab Detail at `active` status. Fields: Post URL (validated as instagram.com/
youtube.com pattern client-side before submit, with a friendly inline error if not), Platform
(segmented, auto-detected from URL), Screenshot (optional, image picker, max 5MB, shown as a
thumbnail with a re-pick option). Big, unambiguous `Submit for Review` button, followed by a
confirm sheet explaining *"Once submitted, the brand has 48 hours to verify — after that it
auto-approves and you get paid."* — set expectations before the irreversible-feeling action.
`POST /collabs/:id/submit`. If `requiresDraftApproval` and no approved draft, this screen should
be unreachable/disabled with a message pointing back to the draft step (mirrors backend's 403
`DRAFT_APPROVAL_REQUIRED`).

**Draft Submission**
Reached from Collab Detail when `requiresDraftApproval && no approved draft`. Shows prior rounds
if any (round number, brand feedback if `changes_requested`), then an upload dropzone for the new
draft (image/video, 50MB cap, progress bar). `POST /collabs/:id/submit-draft`. After submitting,
status card reads *"Waiting for brand review."*

**Open Campaigns (Discover tab)**
`GET /campaigns/open-applications`. Filter bar (content type, niche) collapses into a sheet.
`CampaignCard`: brand name/logo, campaign name, content type, budget-per-creator, spots-remaining
chip ("8 of 15 left"), application-deadline countdown. Tap → Campaign Detail (creator view).
Empty state distinguishes two cases: *"No matching campaigns right now — check back soon"* vs.
(if the creator has zero niches set) *"Add niches to your profile to see matching campaigns"*
with a CTA into Edit Profile — this maps directly to the eligibility rule in the API notes.

**Campaign Detail (Creator view) + Apply Sheet**
Full brief, requirements (min followers/engagement shown as met/not-met checks against the
creator's own profile), budget, deadlines. `Apply` button opens a sheet: select one of your own
packages that fits, optional pitch note (10–2000 char). `POST /campaigns/:id/apply`. After
applying, this campaign should no longer appear in the Discover list (client can just invalidate
and refetch the list query) and now appears under My Applications with status `pending`.

**My Applications**
`GET /creators/me/campaign-applications`. List of campaigns applied to with status
(pending/approved/declined) badges. Approved ones link into the resulting Collab Detail.

**Wallet (Earnings)**
`GET /wallet/summary` + `GET /wallet/earnings/monthly`. Top: large `totalEarned` headline
(explicitly "lifetime, paid out only" per the API note — add a small `ⓘ` that explains pending
vs. completed on tap, since this distinction genuinely confuses users). Below: 3 smaller tiles
for Pending / Processing / On Hold amounts, each tappable → filters the Payout History list.
Monthly bar/line chart (gross vs net) for the last 6–12 months. `Manage Payout Accounts` link.

**Payout History**
`GET /wallet/payouts?status=`. List rows: deal package title + brand name, gross/fee/net amounts,
`StatusBadge` mapped exactly per the table in `frontend_prompt.md` §18 (pending/processing/
completed/failed/on-hold, with `holdReason`/`failedReason` shown via a tappable info icon, not
just implied). Filter chips at top to segment by status.

**Payout Accounts Management**
`GET /wallet/payout-accounts`. List of saved accounts (masked account number, UPI ID, bank name),
primary account has a star/pill, `Set as Primary` action, delete (blocked with an explanatory
toast if it has a pending/processing payout attached, per the API's 400 case). `+ Add Account`
opens the Add/Edit sheet.

**Add/Edit Payout Account Sheet**
Segmented type toggle (UPI / Bank Account), then the relevant fields (mirrors the Bank Setup
onboarding step for the bank variant; single field for UPI). `POST /wallet/payout-accounts`.

**Performance Report Submission**
Reached from a completed Collab Detail at the 7-day/30-day marks (trigger via a notification
type, or a persistent reminder card on the deal after those intervals have passed and no report
of that type exists yet — check `GET /collabs/:id/performance-reports`). Simple numeric form:
views, likes, comments, shares, saves, reach. `POST /collabs/:id/performance-report`.

**Creator Tools Hub** *(optional bonus surface — low priority, build last)*
A lightweight in-app wrapper around the public tools: Price Calculator, Fake-Follower Checker,
personal Analytics Log (`POST`/`GET /tools/analytics-log(s)`), and read-only Brief/Contract
template viewers. These are genuinely public/no-auth endpoints on the backend — useful as
"utility" screens for logged-in creators but not part of the core transaction flow, so they don't
need a tab of their own; surface from Settings or the dashboard's "Tools" row.

---

### 6.5 Brand Screens

**Brand Dashboard (Home)**
`GET /brands/me/dashboard` + `GET /brands/me/dashboard/performance`. Layout:
1. Greeting header + company logo.
2. Stat row: Total Spend, Active Collabs, Pending Approvals (deals at `post_submitted` — this
   count should read as urgent/actionable, distinct styling from the neutral stats around it),
   Open Campaigns.
3. **Needs Your Attention** section — deals at `post_submitted` (verify/dispute) rendered
   prominently, since this is the brand's core recurring responsibility on the platform.
4. Active Collabs preview + Active Campaigns preview, each with "See all."
5. Quick actions row: `Discover Creators`, `Create Campaign`.

**Discover Creators**
`GET /creators` (or `/discovery/creators`, same params). Two-column card grid (`CreatorCard`:
photo, name, niche tags (max 3 shown, "+2" overflow), platform icon, follower range,
`TrustBadge`, starting price, city/state). Sticky filter/sort bar at top (opens `FilterSheet`).
Search box for handle/name. Infinite scroll. Tap → Creator Profile Detail.

**Filter Sheet**
Full filter set from `frontend_prompt.md` §10/§7 (BRD): Platform, Content Type, Niche
(multi-select), Language, State, Follower Range, Price Range (dual slider), Trust Score, and a
sort picker (Highest Engagement / Lowest Price / Most Collabs / Newest / Best Value). `Apply` and
`Reset` buttons pinned at the bottom. Active filter count shown as a badge on the Discover tab's
filter button when the sheet is closed.

**Creator Profile Detail (Brand view)**
Hero: first cover photo as a banner, profile photo overlapping it, name + `creatorTitle` +
`TrustBadge` + follower range chips (IG/YT) underneath. Bio. Niche/language tag rows.
Location. Featured reel (embedded link preview, tap to open). Cover photo gallery
(horizontal scroll, tap to full-screen viewer). **Packages** section — every active package as a
`PackageCard` with a `Request This Package` button on each (this is the primary conversion point
on the whole screen, make it impossible to miss). Below: past reviews
(`GET /creators/:id/reviews`) as a simple rating summary + list. `Save to List` action in the
header (bookmark icon → adds to a saved list, sheet to pick which list or create new).

**Send Collab Request**
Reached by tapping `Request This Package`. Pre-filled package summary card (locked — content
type/quantity/price come from the package). Fields: Brief (10–5000 char textarea, required),
Offered Amount (pre-filled from package price, editable — helper text: *"You can offer above or
below the creator's listed price"*), Posting Deadline (date picker, defaults to +7 days),
Reference Materials (add-link chips, optional), Brand Notes (optional, 2000 char), toggle
`Require draft approval before posting` (off by default — explain in one line what it does: *"The
creator sends you the content to review before they post publicly."*). `Send Request`
→ `POST /collabs`. Success → route straight into the new deal's Collab Detail.

**Saved Lists**
`GET /brands/me/saved-lists`. Simple named-list rows with creator-count. `+ New List` sheet
(name only). Tap → Saved List Detail (grid of `CreatorCard`s, same as Discover, with a remove
action per creator).

**Brand Collabs List / Deal Detail**
Same shared components as §6.3 (My Collabs list shell, Collab Detail) — no brand-specific screen
needed beyond what's already specified there. The `Pay Now` action on an `accepted` deal launches
the Razorpay Checkout Flow (§6.6).

**Campaigns List**
`GET /campaigns`. `CampaignCard`s (name, type badge Brand-Invite/Open-Application, status,
budget, filled-vs-total slots progress bar, deadline). Segmented filter by status
(draft/active/paused/completed/cancelled). Floating `+ Create Campaign` button.

**Create Campaign**
Type toggle at the very top (**Brand-Invite** vs **Open Application**) — this changes which
fields appear below it, framed as two genuinely different setup paths, not a single form with
conditional fields buried in the middle:
- **Shared fields (both types):** Name, Brief (10–5000), Content Type, Product Description
  (optional), Hashtags (chip-add), Target Languages (multi-select), Target Niches (multi-select),
  Posting Deadline, Negotiation Allowed (toggle), Requires Draft Approval (toggle).
- **Brand-Invite only:** Total Budget, Target Influencer Count.
- **Open Application only:** Budget Per Creator, Max Creators, Application Deadline, Min Follower
  Count (optional), Min Engagement Rate (optional), Auto-Accept (toggle, with explainer: *"First
  eligible applicants are approved automatically until spots fill"*).
Multi-step within the form (group into 2–3 logical screens/sections rather than one giant form)
but a single final `Create Campaign` submit. `POST /campaigns`.

**Campaign Detail / Tracker**
`GET /campaigns/:id` + `GET /campaigns/:id/tracker`. Header: name, type badge, status, budget
progress bar (spent/held/refunded). Tabs or sections depending on type:
- **Brand-Invite:** `Creators` tab listing each invited/accepted creator with their individual
  deal status; `+ Invite Creators` button → Invite Creators screen.
- **Open Application:** `Applications` tab (`GET /campaigns/:id/applications`, filterable by
  pending/approved/declined) with `Approve`/`Decline` swipe or button actions per applicant card
  (showing follower range, trust score, engagement, pitch note); `Accepted Creators` tab for
  those already approved, mirroring the tracker view.
Header overflow menu: `Edit`, `Pause`/`Resume`, `Cancel Campaign` (confirm sheet, shows the
dealsCancelled/escrowRefunded impact preview language from the API note before confirming — this
is a real financial action, be explicit).

**Invite Creators to Campaign** *(Brand-Invite type)*
Essentially the Discover screen scoped to campaign context: search/filter creators, each card has
an `Invite` button instead of `Request Package` (pick the package + offered amount inline), and
already-invited creators show a disabled `Already Invited` state per the duplicate-prevention
rule — don't rely on the server 409 alone, disable client-side once a creator is known to be
invited/accepted for this campaign.

**Draft Review** *(Brand side, campaign or direct deal with `requiresDraftApproval`)*
Same underlying data as the creator's Draft Submission screen, viewed from Collab Detail at the
relevant step: media preview (image/video, full-screen viewer, no download per the DRM-style
`Content-Disposition: attachment` handling — treat it as view-only in the UI: no explicit "Save"
affordance), round number, prior feedback if any. Two actions: `Approve`
(`POST /collabs/:id/drafts/:draftId/approve`) or `Request Changes` (opens a text field for
feedback, `POST .../request-changes`).

**Billing & Transactions**
`GET /brands/me/billing`. List of escrow transactions: amount, platform fee, status
(held/released/refunded), linked deal's creator + status. Tap → Transaction Detail
(`GET /brands/me/billing/:transactionId`) — full breakdown, linked deal link.

**Analytics**
`GET /brands/me/analytics` + `.../monthly-spend`. Stat tiles (Total Spend, Total/Completed/Active
Deals, Avg Deal Value), monthly spend chart, Top Creators list (by spend or count), Spend by
Niche (simple horizontal bar breakdown).

**Edit Brand Profile**
Single-screen form mirroring `PUT /brands/me/profile` fields (§6.2 Brand onboarding), reachable
from Settings, includes the `Show brand name in collabs` privacy toggle.

---

### 6.6 Modals & Bottom Sheets (reusable across roles)

**Razorpay Checkout Flow**
1. Brand taps `Pay Now` on an `accepted` deal → show a `Fee Breakdown` confirm sheet first
   (`GET /collabs/:id/fee-breakdown` — collab price, platform fee, total) with a `Confirm & Pay`
   button — never jump straight into a payment SDK without the user seeing the total.
2. `POST /collabs/:id/create-order` → open `RazorpayCheckout.open({...})` with the returned
   `orderId`/`amount`(paise)/`currency`/`keyId`.
3. On SDK success → `POST /collabs/:id/lock-escrow` with the three returned fields → on success,
   pop back to Collab Detail which now shows `active` status and a "Payment secured in escrow"
   success toast.
4. On SDK cancel/failure → stay on the confirm sheet, allow retry, no partial-state confusion
   (deal remains `accepted` until lock-escrow succeeds).

**Confirm Sheet** — generic reusable component for every destructive/financial confirmation
(cancel campaign, delete package, delete payout account with a pending payout blocked message,
reject a request, raise a dispute, submit a post). Title, one-sentence consequence description,
`Cancel` (ghost) + destructive-colored confirm button.

**Filter Sheet** — see §6.5, also reused (in reduced form: content type + niche only) on the
Creator's Open Campaigns screen.

---

## 7. Key Flows End-to-End

### 7.1 Signup → First Use (Creator)
```
Splash → Welcome carousel → Login (email/password or Google)
  → [new user] Role Selection → picks "Creator" → Bank & Payout Setup
  → How It Works → Profile Wizard (7 steps, each auto-saves)
  → Creator Home (profile-completeness banner if any step skipped)
  → browses Open Campaigns / waits for Incoming Requests
```

### 7.2 Signup → First Use (Brand)
```
Splash → Welcome carousel → Login
  → [new user] Role Selection → picks "Brand" → Bank & Payout Setup
  → How It Works (3-step explainer) → "Start Discovering" → Brand Discover tab
  → (optional, later) Edit Brand Profile for full company details
```

### 7.3 Direct Collab, Full Lifecycle
```
Brand: Discover → Creator Profile Detail → pick Package → Send Collab Request
  → Deal status: request_sent
Creator: Incoming Requests → open request → Accept / Reject / Counter-offer
  [if Counter] → Brand: Accept Counter / Reject Counter (max 2 rounds)
  → Deal status: accepted
Brand: Collab Detail → Pay Now → fee breakdown → Razorpay checkout → lock-escrow
  → Deal status: active. Chat opens.
  [if requiresDraftApproval] Creator: Submit Draft → Brand: Approve / Request Changes (repeat)
Creator: Submit Post (URL + screenshot) → Deal status: post_submitted
Brand: Collab Detail → Verify & Release Payment  (or 48h auto-approval fires)
  → Deal status: verified/auto_approved → payout created
Creator: sets payout account for this deal (if not already default) → payout processes
  → Deal status: completed. Chat archives.
Both: Review & Rating prompt appears on the completed deal.
Creator (7d/30d later): Performance Report Submission.
```

### 7.4 Campaign, Open Application Type
```
Brand: Campaigns tab → Create Campaign → type = Open Application → fill fields → Create
Creator: Discover (Open Campaigns) → sees campaign if niche matches + not yet applied
  → Campaign Detail → Apply (pick package + pitch note)
Brand: Campaign Detail → Applications tab → review applicant → Approve / Decline
  [if autoAccept] first eligible applicants approved automatically until cap
  → Approve creates a Deal → same lifecycle as §7.3 from `accepted` onward
```

### 7.5 Campaign, Brand-Invite Type
```
Brand: Create Campaign → type = Brand-Invite → fill fields → Create
  → Campaign Detail → Invite Creators → search/filter → Invite (pick package + amount)
    → duplicate invite to same creator blocked client-side + server 409
Creator: receives invite as a normal Incoming Request scoped to a campaign
  → Accept / Reject / Counter — same as §7.3
  [reject/timeout] → slot reopens on the campaign, brand can invite a replacement
```

---

## 8. Component Library Spec (critical composite components)

**`DealStatusStepper`**
Props: `status: DealStatus`, `requiresDraftApproval: boolean`. Internally maps status → a fixed
step index against one of two step arrays (with-draft vs without-draft), renders a horizontal
row of circles connected by lines (compact card use) or a vertical timeline with labels + relative
timestamps per step (detail-page use). Terminal negative statuses (`rejected/expired/cancelled/
disputed`) render as a red final step replacing the rest of the happy path, not appended after it.

**`TrustBadge`**
Props: `score: 'high'|'medium'|'low'`, `size`. Renders colored dot + short label. Tapping (detail
contexts only) opens an info sheet explaining the auto-computed reputation system in one short
paragraph — most users will not have encountered this model before (it replaced manual
verification) and deserve a one-tap explanation rather than assuming familiarity.

**`PackageCard`**
Props vary by context (`mode: 'manage'|'pick'|'display'`) — manage mode (creator's own list) adds
edit/delete/active-toggle; pick mode (brand sending a request) makes the whole card a tappable
selector with a radio indicator; display mode (public profile) is read-only with a CTA button.
One component, one visual language across all three, so a package always looks the same shape no
matter where it appears.

**`CampaignCard`**
Must clearly differentiate Brand-Invite vs Open-Application at a glance (small type-label chip,
different icon) since brands and creators reason about them differently — never let the two types
look visually identical.

**`ChatBubble`**
Text, image, video, and PDF variants. Image/video attachments render inline (tap to full-screen
viewer); PDFs render as a filename+icon row that opens the system viewer. Off-platform-solicitation
auto-flagging is backend-side — the client doesn't need special UI for it beyond honoring a
`report` action on every bubble.

**`CountdownChip`**
Props: `deadline: ISOString`, `urgentThresholdHours: number`. Recomputes via a 1-minute interval
(not per-second — unnecessary re-renders for a deadline that's usually hours/days out), switches
to `status.danger` color and a pulsing dot once inside the urgent threshold.

---

## 9. Copy & Microcopy Guide

- **Tone:** plain, confident, never cutesy. This app moves real money — copy should read like a
  banking app crossed with a creator tool, not a social app.
- **Money language:** always say what state money is in, never just a status word alone —
  "Payment secured in escrow," "Released to creator," "Refunded to your account," not just
  "Paid."
- **Empty states** always answer "why is this empty, and what do I do about it" — never a bare
  "No results." Examples used above: incomplete profile → niches missing; no conversations →
  explain the escrow-gating rule; no campaigns matching → distinguish "none exist" from "you're
  not eligible yet."
- **Errors:** surface the backend's `message` field directly when it's already user-facing
  (validation messages are written to be shown), only override generic ones like raw 500s with
  *"Something went wrong on our end — try again."**
- **Irreversible actions** (submit post, dispute, cancel campaign, delete package with a live
  deal, remove a payout account) always get one confirm step with a one-sentence consequence, not
  a bare "Are you sure?"
- **Trust Score / follower range / escrow / draft approval** are all mechanics a first-time user
  won't have seen on other apps — each gets exactly one short inline explainer the first time it
  appears (dismissible, remembered per-mechanic in local storage so it doesn't nag on repeat
  views).

---

## 10. Non-Functional Requirements

- **Offline/poor network:** every list screen should render cached data (React Query's cache)
  immediately on reopen, with a subtle "reconnecting…" indicator rather than a blocking spinner
  when data is already available; only cold-start fetches show a full skeleton.
- **Accessibility:** minimum 44×44pt tap targets, all interactive elements have accessible
  labels, color is never the *only* signal for status (pair every `StatusBadge`/`TrustBadge` with
  text, not just a colored dot), support system font-scaling without breaking layouts (test at
  120–150%).
- **Performance:** image lists use `expo-image` with disk caching; large media in chat lazy-loads
  and shows a blurred placeholder; infinite lists use `FlashList` (or RN's `FlatList` with
  `windowSize` tuning) rather than rendering unbounded content.
- **Push notifications:** register the Expo push token after login/onboarding completes (not
  before — no point registering an anonymous device), request permission with a pre-permission
  explainer screen (Apple/Play both reward contextual permission asks).
- **Deep linking:** support universal/app links for password reset and for sharing a public
  Creator Profile Detail link (useful for brand→creator sharing outside the app, e.g. a brand
  forwarding a profile link to a teammate).
- **Analytics events (product, not the in-app Tools feature):** track screen views and key funnel
  events — onboarding step completion/drop-off, request sent → accepted rate, campaign apply
  rate, payment success/failure, dispute rate — via whatever analytics SDK the team picks later;
  just make sure screens expose clean event names, don't hardwire a specific vendor into this
  spec.
- **Environments:** the app should point at a configurable API base URL (`frontend_prompt.md`'s
  base URL for prod, a local/staging override for dev) via Expo's env config, not hardcoded.

---

## 11. Master Build Prompt (paste-ready)

> Build a cross-platform React Native app (Expo + TypeScript) for **InfluenceHub**, an Indian
> influencer-marketing marketplace connecting Brands and Creators through escrow-held payments.
> Use the tech stack, folder structure, and design tokens in `mobile_app_frontend_spec.md` §2–3
> exactly. Wire every screen to the real backend described in `frontend_prompt.md` — do not
> invent endpoints or response shapes; if a screen needs data the API doesn't provide, flag it
> rather than fabricating a field.
>
> Build order: (1) design-system primitives from §3.4, (2) auth + token-refresh + navigation gate
> from §2/§4/§5, (3) onboarding flow §6.2 end-to-end for both roles, (4) shared post-auth shell —
> tab bars, Notifications, Messages, Collab Detail with its status-driven body and
> `DealStatusStepper` (§6.3, §8) since almost everything else links into it, (5) Creator screens
> §6.4, (6) Brand screens §6.5, (7) Razorpay checkout + draft review + dispute flows (§6.6),
> (8) polish: skeletons, empty states per §9, accessibility pass per §10.
>
> One role per account, permanent, chosen once at onboarding — never build a role switcher. Bank
> account is mandatory at onboarding for both roles. Trust Score is auto-computed reputation
> (high/medium/low), not manual verification — never use the word "unverified." Follower counts
> are always ranges, never exact numbers, in any UI. Chat only exists for deals with escrow
> locked. Draft-approval is per-deal (`requiresDraftApproval`), not a fixed rule. Money amounts
> from the API are strings — always `Number()` before formatting, never recompute fees
> client-side. Every list is paginated, pull-to-refreshable, and has distinct loading/empty/error
> states. Follow the exact end-to-end flows in §7 when wiring navigation between screens.
