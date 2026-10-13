import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Check, Megaphone, Sparkles, type LucideIcon } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useOnboardingDraftStore } from '@/lib/auth/onboarding-draft-store';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { roleSelectionSchema, type RoleSelectionInput } from '@/lib/validation/onboarding';

const ROLES: {
  value: RoleSelectionInput['accountType'];
  icon: LucideIcon;
  title: string;
  subtitle: string;
}[] = [
  {
    value: 'brand',
    icon: Megaphone,
    title: "I'm a Brand",
    subtitle: 'Find creators, run campaigns, pay securely',
  },
  {
    value: 'creator',
    icon: Sparkles,
    title: "I'm a Creator",
    subtitle: 'List your packages, get discovered, get paid',
  },
];

function RoleCard({
  role,
  isSelected,
  onPress,
}: {
  role: (typeof ROLES)[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  // A plain Pressable with static classes, deliberately: the cards are the screen's main content,
  // so nothing here animates, measures layout or waits on state before the first paint. Press
  // feedback is the `active:` background. Full-width rows give the description room to breathe.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${role.title}. ${role.subtitle}`}
      className={cn(
        'flex-row items-center gap-4 rounded-md border p-4',
        isSelected ? 'border-accent bg-selected' : 'border-border bg-surface active:bg-base',
      )}
    >
      <View
        className={cn(
          'h-12 w-12 items-center justify-center rounded-md border border-border',
          isSelected ? 'bg-surface' : 'bg-base',
        )}
      >
        <role.icon size={22} strokeWidth={1.5} color={colors.text.primary} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="h3">{role.title}</Text>
        <Text variant="bodySm" color={isSelected ? 'primary' : 'secondary'}>
          {role.subtitle}
        </Text>
      </View>
      {/* The ring is always there, so selecting never shifts the card's content. */}
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border',
          isSelected ? 'border-accent bg-accent' : 'border-border bg-surface',
        )}
      >
        {isSelected && <Check size={14} strokeWidth={3} color={colors.text.inverse} />}
      </View>
    </Pressable>
  );
}

export default function RoleSelectionScreen() {
  const router = useRouter();
  const setRoleStep = useOnboardingDraftStore((s) => s.setRoleStep);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleSelectionInput>({
    resolver: zodResolver(roleSelectionSchema),
    defaultValues: { accountType: undefined, displayName: '' },
  });

  const selectedRole = watch('accountType');

  function onSubmit(values: RoleSelectionInput) {
    setRoleStep(values);
    router.push('/(onboarding)/bank-setup');
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-10">
      <View className="gap-2">
        <Text variant="h1">How will you use FindCollab?</Text>
        <Text variant="body" color="secondary">
          Choose the account type that fits you.
        </Text>
      </View>

      <View className="gap-3">
        <View className="gap-3" accessibilityRole="radiogroup">
          {ROLES.map((role) => (
            <RoleCard
              key={role.value}
              role={role}
              isSelected={selectedRole === role.value}
              onPress={() => {
                haptics.selection();
                setValue('accountType', role.value, { shouldValidate: true });
              }}
            />
          ))}
        </View>
        {errors.accountType?.message && (
          <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
            {errors.accountType.message}
          </Text>
        )}
        <Text variant="bodySm" color="secondary">
          This choice is permanent for this account. To use both, create two accounts with different
          emails.
        </Text>
      </View>

      {/* Rendered plainly once a role is chosen — the label depends on the role. */}
      {selectedRole && (
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={selectedRole === 'brand' ? 'Company / Brand name' : 'Your name'}
              placeholder={selectedRole === 'brand' ? 'Acme Co.' : 'Priya Sharma'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.displayName?.message}
              maxLength={60}
            />
          )}
        />
      )}

      {/* The spacer pins Continue to the bottom of the screen whenever the content is shorter
          than the viewport, so it sits in the same place before and after a role is picked. */}
      <View className="flex-1" />
      <Button size="lg" disabled={!selectedRole} onPress={handleSubmit(onSubmit)}>
        Continue
      </Button>
    </Screen>
  );
}
