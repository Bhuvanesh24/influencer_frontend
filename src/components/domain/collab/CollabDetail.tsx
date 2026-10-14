import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { ChevronDown, ChevronUp, CircleAlert, ExternalLink, MessageCircle, Star } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DealStatusStepper } from '@/components/domain/collab/DealStatusStepper';
import { PaySheet } from '@/components/domain/collab/PaySheet';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import type { AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  acceptCounter,
  acceptDeal,
  approveDraft,
  getDeal,
  getDealReviews,
  getFeeBreakdown,
  getPerformanceReports,
  listDrafts,
  payIntoEscrow,
  rejectCounter,
  rejectDeal,
  submitDraft,
  verifyPost,
  type DealDetail,
  type DealDraft,
} from '@/lib/api/collabs';
import type { AccountType } from '@/lib/auth/types';
import { counterpartName, counterpartPhoto } from '@/lib/collab-view';
import { contentTypeLabel } from '@/lib/constants';
import { dealStatusMeta } from '@/lib/deal-status';
import { formatMoney } from '@/lib/money';
import {
  collabDetailKey,
  collabDraftsKey,
  collabFeesKey,
  collabReportsKey,
  collabReviewsKey,
} from '@/lib/query-keys';

type Viewer = AccountType;

/**
 * Collab Detail (prompt.md §6.3) — the whole deal lifecycle on one screen. The action card's
 * content is decided entirely by (status, viewer role); everything else (timeline, brief, fees)
 * is the same for both sides. Used by `creator/collab/[id]` and `brand/collab/[id]`.
 */
export function CollabDetail({ id, viewer }: { id: string; viewer: Viewer }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { data: deal, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: collabDetailKey(id),
    queryFn: () => getDeal(id),
  });
  useRefetchOnFocus(refetch);
  // Shares its cache with the action cards' draft lists.
  const { data: drafts } = useQuery({
    queryKey: collabDraftsKey(id),
    queryFn: () => listDrafts(id),
    enabled: !!deal?.requiresDraftApproval,
  });

  if (isPending) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-base px-6">
        <ScreenHeader />
        <SkeletonDetailPage />
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-base px-6">
        <ScreenHeader />
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load this collab"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const name = counterpartName(deal, viewer);
  const status = dealStatusMeta(deal.status);
  const hasCounter = deal.status === 'request_sent' && !!deal.counterOfferAmount;
  const chatOpen = deal.chatState === 'OPEN' || deal.chatState === 'ARCHIVED';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="px-6">
        <ScreenHeader title={deal.dealNumber} />
      </View>
      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-32 pt-2"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text.muted} />}
      >
        <View className="flex-row items-center gap-3">
          <Avatar name={name} uri={counterpartPhoto(deal, viewer)} size="md" />
          <View className="flex-1 gap-0.5">
            <Text variant="h2" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="bodySm" color="secondary" numberOfLines={1}>
              {deal.package ? `${deal.package.title} · ` : ''}
              {contentTypeLabel(deal.contentType)}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <StatusBadge label={hasCounter ? 'Counter-offer' : status.label} tone={hasCounter ? 'held' : status.tone} />
          {deal.campaign && <StatusBadge label={deal.campaign.name} tone="neutral" />}
          <View className="ml-auto items-end">
            <MoneyText amount={deal.offeredAmount} variant="h2" />
          </View>
        </View>

        {viewer === 'creator' ? <CreatorActions deal={deal} /> : <BrandActions deal={deal} name={name} />}

        <Section title="Timeline">
          <DealStatusStepper
            status={deal.status}
            requiresDraftApproval={deal.requiresDraftApproval}
            hasApprovedDraft={(drafts ?? []).some((d) => d.status === 'approved')}
            statusLog={deal.statusLog}
          />
        </Section>

        <BriefSection deal={deal} />
        <FeeCard deal={deal} viewer={viewer} />
      </ScrollView>

      {chatOpen && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface px-6 pb-8 pt-3">
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<MessageCircle size={18} color={colors.text.primary} />}
            onPress={() => router.push({ pathname: `/${viewer}/chat/[dealId]`, params: { dealId: deal.id } } as unknown as Href)}
          >
            {deal.chatState === 'ARCHIVED' ? 'View chat' : `Message ${name}`}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

// ---- Layout pieces ----------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="h3">{title}</Text>
      {children}
    </View>
  );
}

function ActionCard({ title, body, children }: { title: string; body?: ReactNode; children?: ReactNode }) {
  return (
    <View className="gap-4 rounded-md border border-border bg-surface p-4">
      <View className="gap-1">
        <Text variant="h3">{title}</Text>
        {typeof body === 'string' ? (
          <Text variant="bodySm" color="secondary">
            {body}
          </Text>
        ) : (
          body
        )}
      </View>
      {children}
    </View>
  );
}

function BriefSection({ deal }: { deal: DealDetail }) {
  const [open, setOpen] = useState(deal.status === 'request_sent' || deal.status === 'active');
  const { colors } = useAppTheme();
  return (
    <View className="rounded-md border border-border bg-surface">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="min-h-13 flex-row items-center justify-between px-4 py-3 active:bg-base"
      >
        <Text variant="h3">Brief & details</Text>
        {open ? <ChevronUp size={18} color={colors.text.muted} /> : <ChevronDown size={18} color={colors.text.muted} />}
      </Pressable>
      {open && (
        <View className="gap-4 border-t border-border p-4">
          <Text variant="body">{deal.brief}</Text>
          <Detail label="Post by" value={dayjs(deal.postingDeadline).format('ddd, D MMM YYYY')} />
          {deal.package && (
            <Detail label="Package" value={`${deal.package.title} · ${contentTypeLabel(deal.package.contentType)}`} />
          )}
          <Detail label="Draft approval" value={deal.requiresDraftApproval ? 'Required before posting' : 'Not required'} />
          {deal.brandNotes && <Detail label="Notes from the brand" value={deal.brandNotes} />}
          {deal.referenceMaterials.length > 0 && (
            <View className="gap-2">
              <Text variant="caption" color="secondary">
                Reference material
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {deal.referenceMaterials.map((url) => (
                  <Chip
                    key={url}
                    selectable
                    accessibilityRole="link"
                    label={url.replace(/^https?:\/\//, '')}
                    onPress={() => Linking.openURL(url)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="bodySm">{value}</Text>
    </View>
  );
}

/** Fee transparency (prompt.md §6.3): always visible, from the server's breakdown. */
function FeeCard({ deal, viewer }: { deal: DealDetail; viewer: Viewer }) {
  const { data } = useQuery({ queryKey: collabFeesKey(deal.id), queryFn: () => getFeeBreakdown(deal.id) });
  if (!data) return null;
  const escrow = deal.escrowTransaction;
  const where =
    escrow?.status === 'released'
      ? viewer === 'creator'
        ? 'Released to you'
        : 'Released to the creator'
      : escrow?.status === 'refunded'
        ? 'Refunded to the brand'
        : escrow?.status === 'disputed'
          ? 'Held in escrow while the dispute is reviewed'
          : escrow
            ? 'Secured in escrow'
            : 'Not paid yet';
  return (
    <Section title="Money">
      <View className="gap-3 rounded-md border border-border bg-surface p-4">
        <Text variant="bodySm" weight="semibold">
          {where}
        </Text>
        <FeeRow label="Collab price" amount={data.offeredAmount} />
        {viewer === 'brand' ? (
          <>
            <FeeRow label={`Platform fee (${data.platformCommissionRate})`} amount={data.brandSideFee} />
            <View className="h-px bg-border" />
            <FeeRow label="You pay" amount={data.brandTotalCost} strong />
          </>
        ) : (
          <>
            <FeeRow label={`Platform fee (${data.platformCommissionRate})`} amount={`-${data.creatorSideFee}`} />
            <View className="h-px bg-border" />
            <FeeRow label="You receive" amount={data.creatorNetPayout} strong />
          </>
        )}
      </View>
    </Section>
  );
}

function FeeRow({ label, amount, strong }: { label: string; amount: string; strong?: boolean }) {
  const negative = amount.startsWith('-');
  return (
    <View className="flex-row items-baseline justify-between">
      <Text variant="bodySm" color={strong ? 'primary' : 'secondary'} weight={strong ? 'semibold' : 'regular'}>
        {label}
      </Text>
      <Text variant={strong ? 'h3' : 'bodySm'} weight={strong ? 'semibold' : 'medium'}>
        {negative ? `− ${formatMoney(amount.slice(1))}` : formatMoney(amount)}
      </Text>
    </View>
  );
}

function PostLink({ deal }: { deal: DealDetail }) {
  const { colors } = useAppTheme();
  const sub = deal.latestSubmission;
  if (!sub) return null;
  return (
    <Pressable
      onPress={() => Linking.openURL(sub.postUrl)}
      accessibilityRole="link"
      className="flex-row items-center gap-2 rounded-md border border-border bg-base px-3 py-3 active:opacity-70"
    >
      <ExternalLink size={16} color={colors.text.primary} />
      <Text variant="bodySm" weight="medium" numberOfLines={1} className="flex-1">
        {sub.postUrl.replace(/^https?:\/\/(www\.)?/, '')}
      </Text>
    </Pressable>
  );
}

// ---- Drafts -----------------------------------------------------------------------------------

function DraftList({ drafts }: { drafts: DealDraft[] }) {
  if (drafts.length === 0) return null;
  return (
    <View className="gap-2">
      {[...drafts].reverse().map((d) => (
        <View key={d.id} className="flex-row gap-3 rounded-md border border-border bg-base p-3">
          <Image source={{ uri: d.fileUrl }} style={{ width: 56, height: 72, borderRadius: 8 }} contentFit="cover" />
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Text variant="bodySm" weight="semibold">
                Draft {d.round}
              </Text>
              <StatusBadge
                label={d.status === 'approved' ? 'Approved' : d.status === 'pending' ? 'Waiting for review' : 'Changes requested'}
                tone={d.status === 'approved' ? 'positive' : d.status === 'pending' ? 'info' : 'held'}
              />
            </View>
            {d.brandFeedback && (
              <Text variant="caption" color="secondary">
                “{d.brandFeedback}”
              </Text>
            )}
            <Text variant="caption" color="muted">
              Sent {dayjs(d.submittedAt).format('D MMM, h:mm a')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---- Creator ----------------------------------------------------------------------------------

function CreatorActions({ deal }: { deal: DealDetail }) {
  const router = useRouter();
  const { ask, sheet } = useConfirmSheet();
  const brand = counterpartName(deal, 'creator');
  const accept = useDealMutation(() => acceptDeal(deal.id), {
    success: 'Collab accepted',
    successBody: `${brand} has been asked to pay into escrow.`,
  });
  const decline = useDealMutation(() => rejectDeal(deal.id), { success: 'Request declined' });
  const draftsQuery = useQuery({
    queryKey: collabDraftsKey(deal.id),
    queryFn: () => listDrafts(deal.id),
    enabled: deal.requiresDraftApproval,
  });
  const sendDraft = useDealMutation((uri: string) => submitDraft(deal.id, uri), {
    success: 'Draft sent',
    successBody: `${brand} will review it before you post.`,
  });

  const drafts = draftsQuery.data ?? [];
  const approved = drafts.some((d) => d.status === 'approved');
  const pending = drafts.find((d) => d.status === 'pending');

  async function pickDraft() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.85 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    ask({
      title: `Send draft ${drafts.length + 1}?`,
      description: `${brand} reviews it and either approves it or asks for changes.`,
      confirmLabel: 'Send draft',
      onConfirm: () => sendDraft.mutate(uri),
    });
  }

  let card: ReactNode;
  switch (deal.status) {
    case 'request_sent':
      card = deal.counterOfferAmount ? (
        <ActionCard
          title="Waiting for the brand"
          body={`You proposed ${formatMoney(deal.counterOfferAmount)} instead of ${formatMoney(deal.offeredAmount)}. ${brand} can accept or decline it.`}
        >
          {deal.requestExpiresAt && <CountdownChip until={deal.requestExpiresAt} label="Expires" />}
        </ActionCard>
      ) : (
        <ActionCard
          title="New request"
          body={`${brand} offers ${formatMoney(deal.offeredAmount)} — you receive ${formatMoney(deal.creatorPayout)} after the platform fee. Post by ${dayjs(deal.postingDeadline).format('D MMM')}.`}
        >
          {deal.requestExpiresAt && <CountdownChip until={deal.requestExpiresAt} label="Respond" />}
          <Button size="lg" loading={accept.isPending} onPress={() => accept.mutate()}>
            Accept
          </Button>
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={deal.counterOfferRounds >= 2}
              onPress={() => router.push({ pathname: '/creator/collab/counter-offer', params: { id: deal.id } })}
            >
              Counter-offer
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              loading={decline.isPending}
              onPress={() =>
                ask({
                  title: 'Decline this request?',
                  description: `${brand} will be told you passed. This can't be undone.`,
                  confirmLabel: 'Decline',
                  destructive: true,
                  onConfirm: () => decline.mutate(),
                })
              }
            >
              Decline
            </Button>
          </View>
          {deal.counterOfferRounds > 0 && (
            <Text variant="caption" color="muted">
              {2 - deal.counterOfferRounds} counter-offer round{deal.counterOfferRounds === 1 ? '' : 's'} left.
            </Text>
          )}
        </ActionCard>
      );
      break;
    case 'accepted':
    case 'payment_pending':
      card = (
        <ActionCard
          title="Waiting for payment"
          body={`${brand} needs to pay into escrow before you start. You'll get a notification once it's secured.`}
        />
      );
      break;
    case 'active':
      card =
        deal.requiresDraftApproval && !approved ? (
          <ActionCard
            title={pending ? 'Draft with the brand' : 'Send a draft first'}
            body={
              pending
                ? `${brand} is reviewing draft ${pending.round}. You can post once it's approved.`
                : `${brand} wants to see the content before it goes live. Send a photo or video draft.`
            }
          >
            <DraftList drafts={drafts} />
            {!pending && (
              <Button size="lg" loading={sendDraft.isPending} onPress={pickDraft}>
                {drafts.length > 0 ? `Send draft ${drafts.length + 1}` : 'Send draft'}
              </Button>
            )}
          </ActionCard>
        ) : (
          <ActionCard
            title="Time to post"
            body={`Payment is secured in escrow. Post the content, then share the link so ${brand} can verify it.`}
          >
            <CountdownChip until={deal.postingDeadline} label="Post by" />
            {deal.requiresDraftApproval && <DraftList drafts={drafts} />}
            <Button size="lg" onPress={() => router.push({ pathname: '/creator/collab/submit-post', params: { id: deal.id } })}>
              Submit post
            </Button>
          </ActionCard>
        );
      break;
    case 'post_submitted':
      card = (
        <ActionCard
          title="Submitted — waiting for verification"
          body={`${brand} has 48 hours to verify. After that it approves automatically and you get paid.`}
        >
          {deal.latestSubmission?.verificationDeadline && (
            <CountdownChip until={deal.latestSubmission.verificationDeadline} label="Auto-approves" />
          )}
          <PostLink deal={deal} />
        </ActionCard>
      );
      break;
    case 'verified':
    case 'auto_approved':
    case 'completed':
      card = (
        <>
          <ActionCard
            title="Paid out"
            body={`${formatMoney(deal.creatorPayout)} was released to your payout account${deal.latestSubmission?.autoApproved ? ' after the post auto-approved' : ''}.`}
          >
            <PostLink deal={deal} />
          </ActionCard>
          <ReviewPrompt deal={deal} viewer="creator" />
          <ReportsCard deal={deal} />
        </>
      );
      break;
    case 'disputed':
      card = <DisputeCard deal={deal} viewer="creator" />;
      break;
    default:
      card = <ClosedCard deal={deal} viewer="creator" />;
  }

  return (
    <>
      {card}
      {sheet}
    </>
  );
}

// ---- Brand ------------------------------------------------------------------------------------

function BrandActions({ deal, name }: { deal: DealDetail; name: string }) {
  const router = useRouter();
  const { ask, sheet } = useConfirmSheet();
  const payRef = useRef<AppBottomSheetRef>(null);
  const takeCounter = useDealMutation(() => acceptCounter(deal.id), {
    success: 'Counter-offer accepted',
    successBody: 'Pay into escrow to start the collab.',
  });
  const refuseCounter = useDealMutation(() => rejectCounter(deal.id), { success: 'Counter-offer declined' });
  const pay = useDealMutation(() => payIntoEscrow(deal.id), {
    success: 'Payment secured in escrow',
    successBody: `${name} can start creating.`,
    onSuccess: () => payRef.current?.dismiss(),
  });
  const verify = useDealMutation(() => verifyPost(deal.id), {
    success: 'Post verified',
    successBody: `Payment released to ${name}.`,
  });
  const draftsQuery = useQuery({
    queryKey: collabDraftsKey(deal.id),
    queryFn: () => listDrafts(deal.id),
    enabled: deal.requiresDraftApproval,
  });
  const drafts = draftsQuery.data ?? [];
  const pending = drafts.find((d) => d.status === 'pending');
  const approved = drafts.some((d) => d.status === 'approved');
  const approve = useDealMutation((draftId: string) => approveDraft(deal.id, draftId), {
    success: 'Draft approved',
    successBody: `${name} can post it now.`,
  });

  let card: ReactNode;
  switch (deal.status) {
    case 'request_sent':
      card = deal.counterOfferAmount ? (
        <ActionCard
          title={`${name} proposed ${formatMoney(deal.counterOfferAmount)}`}
          body={`You offered ${formatMoney(deal.offeredAmount)}. Accept to move ahead at the new price, or decline to end the request.`}
        >
          <Button size="lg" loading={takeCounter.isPending} onPress={() => takeCounter.mutate()}>
            Accept {formatMoney(deal.counterOfferAmount)}
          </Button>
          <Button
            variant="secondary"
            loading={refuseCounter.isPending}
            onPress={() =>
              ask({
                title: 'Decline the counter-offer?',
                description: 'The request ends here. You can send a new one later.',
                confirmLabel: 'Decline',
                destructive: true,
                onConfirm: () => refuseCounter.mutate(),
              })
            }
          >
            Decline
          </Button>
        </ActionCard>
      ) : (
        <ActionCard title={`Waiting for ${name} to respond`} body="They can accept, decline or propose a different price.">
          {deal.requestExpiresAt && <CountdownChip until={deal.requestExpiresAt} label="Expires" />}
        </ActionCard>
      );
      break;
    case 'accepted':
    case 'payment_pending':
      card = (
        <ActionCard
          title={`${name} accepted`}
          body="Pay into escrow to start. The money is only released after you verify the post."
        >
          <Button size="lg" onPress={() => payRef.current?.present()}>
            Pay now
          </Button>
        </ActionCard>
      );
      break;
    case 'active':
      card =
        deal.requiresDraftApproval && !approved ? (
          <ActionCard
            title={pending ? `Review draft ${pending.round}` : `Waiting for ${name}'s draft`}
            body={
              pending
                ? 'Approve it so they can post, or ask for changes.'
                : 'You asked to see the content before it goes live. The draft will appear here.'
            }
          >
            {pending && (
              <Image
                source={{ uri: pending.fileUrl }}
                style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }}
                contentFit="cover"
                accessibilityLabel={`Draft ${pending.round}`}
              />
            )}
            <DraftList drafts={drafts.filter((d) => d.id !== pending?.id)} />
            {pending && (
              <View className="gap-3">
                <Button size="lg" loading={approve.isPending} onPress={() => approve.mutate(pending.id)}>
                  Approve draft
                </Button>
                <Button
                  variant="secondary"
                  onPress={() =>
                    router.push({ pathname: '/brand/collab/request-changes', params: { id: deal.id, draftId: pending.id } })
                  }
                >
                  Request changes
                </Button>
              </View>
            )}
          </ActionCard>
        ) : (
          <ActionCard
            title="In progress"
            body={`Payment is secured in escrow. ${name} posts by ${dayjs(deal.postingDeadline).format('D MMM')}.`}
          >
            <CountdownChip until={deal.postingDeadline} label="Post by" />
          </ActionCard>
        );
      break;
    case 'post_submitted':
      card = (
        <ActionCard
          title="Post ready to verify"
          body="Check the post. Verifying releases the payment; if something is wrong, raise a dispute instead."
        >
          {deal.latestSubmission?.verificationDeadline && (
            <CountdownChip until={deal.latestSubmission.verificationDeadline} label="Auto-approves" />
          )}
          <PostLink deal={deal} />
          <Button
            size="lg"
            loading={verify.isPending}
            onPress={() =>
              ask({
                title: 'Verify and release payment?',
                description: `${formatMoney(deal.creatorPayout)} goes to ${name}. This can't be undone.`,
                confirmLabel: 'Verify & release',
                onConfirm: () => verify.mutate(),
              })
            }
          >
            Verify & release payment
          </Button>
          <Button variant="secondary" onPress={() => router.push({ pathname: '/brand/collab/dispute', params: { id: deal.id } })}>
            Raise a dispute
          </Button>
        </ActionCard>
      );
      break;
    case 'verified':
    case 'auto_approved':
    case 'completed':
      card = (
        <>
          <ActionCard
            title="Completed"
            body={`Payment released to ${name}${deal.latestSubmission?.autoApproved ? ' after the post auto-approved' : ''}.`}
          >
            <PostLink deal={deal} />
          </ActionCard>
          <ReviewPrompt deal={deal} viewer="brand" />
        </>
      );
      break;
    case 'disputed':
      card = <DisputeCard deal={deal} viewer="brand" />;
      break;
    default:
      card = <ClosedCard deal={deal} viewer="brand" />;
  }

  return (
    <>
      {card}
      <PaySheet ref={payRef} dealId={deal.id} creatorName={name} paying={pay.isPending} onConfirm={() => pay.mutate()} />
      {sheet}
    </>
  );
}

// ---- Shared end states ------------------------------------------------------------------------

function ReviewPrompt({ deal, viewer }: { deal: DealDetail; viewer: Viewer }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data } = useQuery({ queryKey: collabReviewsKey(deal.id), queryFn: () => getDealReviews(deal.id) });
  if (!data || deal.status !== 'completed') return null;
  const mine = data.reviews.find((r) => r.reviewerRole === viewer);
  const theirs = data.reviews.find((r) => r.reviewerRole !== viewer);
  const other = counterpartName(deal, viewer);

  return (
    <ActionCard title="Reviews">
      {mine ? (
        <ReviewLine label="Your review" rating={mine.rating} comment={mine.comment} />
      ) : (
        <Button
          variant="secondary"
          leftIcon={<Star size={16} color={colors.text.primary} />}
          onPress={() => router.push({ pathname: `/${viewer}/collab/review`, params: { id: deal.id } } as unknown as Href)}
        >
          {`Rate ${other}`}
        </Button>
      )}
      {theirs && <ReviewLine label={`${other}'s review of you`} rating={theirs.rating} comment={theirs.comment} />}
    </ActionCard>
  );
}

function ReviewLine({ label, rating, comment }: { label: string; rating: number; comment: string | null }) {
  return (
    <View className="gap-1">
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="body" weight="semibold">
        {'★'.repeat(rating)}
        <Text variant="body" color="muted">
          {'★'.repeat(5 - rating)}
        </Text>
      </Text>
      {comment && <Text variant="bodySm">{comment}</Text>}
    </View>
  );
}

function ReportsCard({ deal }: { deal: DealDetail }) {
  const router = useRouter();
  const { data } = useQuery({ queryKey: collabReportsKey(deal.id), queryFn: () => getPerformanceReports(deal.id) });
  if (!data || !deal.completedAt) return null;
  const daysSince = dayjs().diff(dayjs(deal.completedAt), 'day', true);
  const kinds = [
    { type: 'seven_day' as const, label: '7-day results', from: 6 },
    { type: 'thirty_day' as const, label: '30-day results', from: 28 },
  ];
  return (
    <ActionCard title="Post results" body="Share how the post performed. Brands see these numbers on the collab.">
      {kinds.map((k) => {
        const report = data.find((r) => r.reportType === k.type);
        if (report) {
          return (
            <View key={k.type} className="gap-1 rounded-md border border-border bg-base p-3">
              <Text variant="bodySm" weight="semibold">
                {k.label}
              </Text>
              <Text variant="caption" color="secondary">
                {[
                  report.views != null && `${report.views.toLocaleString('en-IN')} views`,
                  report.likes != null && `${report.likes.toLocaleString('en-IN')} likes`,
                  report.comments != null && `${report.comments.toLocaleString('en-IN')} comments`,
                  report.reach != null && `${report.reach.toLocaleString('en-IN')} reach`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          );
        }
        const open = daysSince >= k.from;
        return (
          <Button
            key={k.type}
            variant="secondary"
            disabled={!open}
            onPress={() => router.push({ pathname: '/creator/collab/report', params: { id: deal.id, type: k.type } })}
          >
            {open ? `Add ${k.label}` : `${k.label} from ${dayjs(deal.completedAt).add(k.from, 'day').format('D MMM')}`}
          </Button>
        );
      })}
    </ActionCard>
  );
}

function DisputeCard({ deal, viewer }: { deal: DealDetail; viewer: Viewer }) {
  const dispute = deal.disputes[0];
  return (
    <ActionCard
      title="Under dispute"
      body={
        viewer === 'brand'
          ? 'Trust & Safety is reviewing this collab. The payment stays in escrow until they decide.'
          : 'The brand raised a dispute. Trust & Safety is reviewing it; the payment stays in escrow until they decide.'
      }
    >
      {dispute && (
        <View className="gap-2 rounded-md border border-border bg-base p-3">
          <Detail label="Reason" value={dispute.reason} />
          <Detail label="Raised" value={dayjs(dispute.raisedAt).format('D MMM YYYY, h:mm a')} />
          {dispute.resolutionDeadline && (
            <Detail label="Decision expected by" value={dayjs(dispute.resolutionDeadline).format('D MMM YYYY')} />
          )}
        </View>
      )}
    </ActionCard>
  );
}

function ClosedCard({ deal, viewer }: { deal: DealDetail; viewer: Viewer }) {
  const other = counterpartName(deal, viewer);
  const copy: Record<string, string> = {
    rejected:
      viewer === 'creator'
        ? 'This request was declined. Nothing was paid.'
        : `${other} declined this request. Nothing was charged.`,
    expired: 'The request expired before anyone responded. Nothing was charged.',
    cancelled: deal.escrowTransaction
      ? 'This collab was cancelled. The escrow payment was refunded to the brand.'
      : 'This collab was cancelled before payment. Nothing was charged.',
  };
  return <ActionCard title={dealStatusMeta(deal.status).label} body={deal.cancellationReason ?? copy[deal.status] ?? ''} />;
}
