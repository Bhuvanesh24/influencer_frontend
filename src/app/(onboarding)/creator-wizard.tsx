import { useRouter } from 'expo-router';
import { ChevronLeft, PartyPopper } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';

import { Step1Identity } from '@/components/domain/creator-wizard/Step1Identity';
import { Step2Location } from '@/components/domain/creator-wizard/Step2Location';
import { Step3LanguagesNiches } from '@/components/domain/creator-wizard/Step3LanguagesNiches';
import { Step4SocialAccounts } from '@/components/domain/creator-wizard/Step4SocialAccounts';
import { Step5Photos } from '@/components/domain/creator-wizard/Step5Photos';
import { Step6Phone } from '@/components/domain/creator-wizard/Step6Phone';
import { Step7FirstPackage } from '@/components/domain/creator-wizard/Step7FirstPackage';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StepProgress } from '@/components/ui/StepProgress';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { markHowItWorksSeen } from '@/lib/local-flags';

const TOTAL_STEPS = 7;

export default function CreatorWizardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const step = useCreatorWizardStore((s) => s.step);
  const setStep = useCreatorWizardStore((s) => s.setStep);

  function goNext() {
    setStep(Math.min(step + 1, TOTAL_STEPS + 1));
  }
  function goBack() {
    setStep(Math.max(step - 1, 1));
  }
  async function finish() {
    await markHowItWorksSeen();
    // Creator Home ships in Phase 2 (see SPRINTS.md) — the wizard's own success screen below is
    // the real "you're done" moment in the meantime.
    router.replace('/coming-soon');
  }

  const isSuccessScreen = step > TOTAL_STEPS;

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-6 pt-14">
      {!isSuccessScreen && (
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            {step > 1 && (
              <Pressable onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
                <ChevronLeft size={22} color={colors.text.secondary} />
              </Pressable>
            )}
            <View className="flex-1">
              <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
            </View>
          </View>
        </View>
      )}

      {step === 1 && <Step1Identity onNext={goNext} />}
      {step === 2 && <Step2Location onNext={goNext} />}
      {step === 3 && <Step3LanguagesNiches onNext={goNext} />}
      {step === 4 && <Step4SocialAccounts onNext={goNext} />}
      {step === 5 && <Step5Photos onNext={goNext} />}
      {step === 6 && <Step6Phone onNext={goNext} />}
      {step === 7 && <Step7FirstPackage onNext={goNext} onSkip={goNext} />}

      {isSuccessScreen && (
        <View className="flex-1 items-center justify-center gap-4 px-4">
          <MotiView
            from={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="rounded-full bg-brand/10 p-5"
          >
            <PartyPopper size={36} color={colors.brand.primary} />
          </MotiView>
          <Text variant="h1" weight="bold" className="text-center">
            You&apos;re all set!
          </Text>
          <Text variant="body" color="secondary" className="text-center">
            Your profile is ready. Brands can now discover and book you.
          </Text>
          <Button size="lg" onPress={finish} className="mt-4">
            Go to My Dashboard
          </Button>
        </View>
      )}
    </Screen>
  );
}
