import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Megaphone, Sparkles, type LucideIcon } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useOnboardingDraftStore } from '@/lib/auth/onboarding-draft-store';
import { cn } from '@/lib/cn';
import { roleSelectionSchema, type RoleSelectionInput } from '@/lib/validation/onboarding';

const ROLES: {
  value: RoleSelectionInput['accountType'];
  icon: LucideIcon;
  title: string;
  subtitle: string;
}[] = [
  { value: 'brand', icon: Megaphone, title: "I'm a Brand", subtitle: 'Find creators, run campaigns, pay securely' },
  { value: 'creator', icon: Sparkles, title: "I'm a Creator", subtitle: 'List your packages, get discovered, get paid' },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
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
    <Screen scroll keyboardAvoiding contentClassName="gap-6 pt-16">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          How will you use InfluenceHub?
        </Text>
        <Text variant="body" color="secondary">
          Choose the account type that fits you.
        </Text>
      </View>

      <View className="flex-row gap-3">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => setValue('accountType', role.value, { shouldValidate: true })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'flex-1 gap-3 rounded-md border p-4',
                isSelected ? 'border-brand bg-brand/5' : 'border-border bg-surface',
              )}
            >
              <View className={cn('self-start rounded-full p-3', isSelected ? 'bg-brand/15' : 'bg-base')}>
                <role.icon size={22} color={isSelected ? colors.brand.primary : colors.text.secondary} />
              </View>
              <Text variant="h3" weight="semibold">
                {role.title}
              </Text>
              <Text variant="caption" color="secondary">
                {role.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" color="muted">
        This choice is permanent for this account. To use both, create two accounts with different
        emails.
      </Text>

      {selectedRole && (
        <View className="gap-4">
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
          <Button size="lg" onPress={handleSubmit(onSubmit)}>
            Continue
          </Button>
        </View>
      )}
    </Screen>
  );
}
