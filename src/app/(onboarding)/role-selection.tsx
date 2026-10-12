import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Check, Megaphone, Sparkles, type LucideIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { HeroOrb } from '@/components/ui/HeroOrb';
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
  { value: 'brand', icon: Megaphone, title: "I'm a Brand", subtitle: 'Find creators, run campaigns, pay securely' },
  { value: 'creator', icon: Sparkles, title: "I'm a Creator", subtitle: 'List your packages, get discovered, get paid' },
];

function RoleCard({
  role,
  isSelected,
  onPress,
  index,
}: {
  role: (typeof ROLES)[number];
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const { colors } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: index * 90 }}
      className="flex-1"
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <MotiView
          animate={{ scale: isPressed ? 0.96 : 1 }}
          transition={{ type: 'timing', duration: 90 }}
          className={cn(
            'relative gap-3 rounded-xl border p-4',
            isSelected ? 'border-brand bg-brand/5' : 'border-border bg-surface',
          )}
          style={
            isSelected
              ? {
                  shadowColor: colors.brand.primary,
                  shadowOpacity: 0.16,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 3,
                }
              : undefined
          }
        >
          {isSelected && (
            <View className="absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-brand">
              <Check size={12} color="#FFFFFF" />
            </View>
          )}
          <View className={cn('self-start rounded-full p-3', isSelected ? 'bg-brand/15' : 'bg-base')}>
            <role.icon size={22} color={isSelected ? colors.brand.primary : colors.text.secondary} />
          </View>
          <Text variant="h3" weight="semibold">
            {role.title}
          </Text>
          <Text variant="caption" color="secondary">
            {role.subtitle}
          </Text>
        </MotiView>
      </Pressable>
    </MotiView>
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
    <Screen scroll keyboardAvoiding backdrop={<HeroOrb />} contentClassName="gap-6 pt-10">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          How will you use FindCollab?
        </Text>
        <Text variant="body" color="secondary">
          Choose the account type that fits you.
        </Text>
      </View>

      <View className="flex-row gap-3">
        {ROLES.map((role, i) => (
          <RoleCard
            key={role.value}
            role={role}
            index={i}
            isSelected={selectedRole === role.value}
            onPress={() => {
              haptics.selection();
              setValue('accountType', role.value, { shouldValidate: true });
            }}
          />
        ))}
      </View>

      <Text variant="caption" color="muted">
        This choice is permanent for this account. To use both, create two accounts with different
        emails.
      </Text>

      {selectedRole && (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 220 }}
          className="gap-4"
        >
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
        </MotiView>
      )}
    </Screen>
  );
}
