import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';

import { Step1Identity } from '@/components/domain/creator-wizard/Step1Identity';
import { Step2Location } from '@/components/domain/creator-wizard/Step2Location';
import { Step3LanguagesNiches } from '@/components/domain/creator-wizard/Step3LanguagesNiches';
import { Step4SocialAccounts } from '@/components/domain/creator-wizard/Step4SocialAccounts';
import { Step5Photos } from '@/components/domain/creator-wizard/Step5Photos';
import { Step6Phone } from '@/components/domain/creator-wizard/Step6Phone';
import { Step7FirstPackage } from '@/components/domain/creator-wizard/Step7FirstPackage';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { Text } from '@/components/ui/Text';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { haptics } from '@/lib/haptics';
import { markHowItWorksSeen } from '@/lib/local-flags';

const TOTAL_STEPS = 7;

export default function CreatorWizardScreen() {
  const router = useRouter();
  const step = useCreatorWizardStore((s) => s.step);
  const setStep = useCreatorWizardStore((s) => s.setStep);

  const isSuccessScreen = step > TOTAL_STEPS;
  // Step 1 has no earlier step, and the success screen is a one-way door.
  const canStepBack = step > 1 && !isSuccessScreen;

  function goNext() {
    const next = Math.min(step + 1, TOTAL_STEPS + 1);
    if (next > TOTAL_STEPS) {
      haptics.success();
    } else {
      haptics.light();
    }
    setStep(next);
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

  // Android Back walks back one step (each step re-reads its saved values from the wizard
  // store, so nothing typed earlier is lost) instead of dropping out of the whole wizard.
  useEffect(() => {
    if (!canStepBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(Math.max(step - 1, 1));
      return true;
    });
    return () => subscription.remove();
  }, [canStepBack, step, setStep]);

  if (isSuccessScreen) {
    return (
      <Screen contentClassName="justify-center gap-8 px-6">
        <IconBadge icon={Check} tone="positive" />
        <View className="gap-2">
          <Text variant="display">You&apos;re all set</Text>
          <Text variant="body" color="secondary">
            Your profile is ready. Brands can now discover and book you.
          </Text>
        </View>
        <Button size="lg" onPress={finish}>
          Go to My Dashboard
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding scrollResetKey={step} contentClassName="gap-8 pt-2">
      <View className="gap-3">
        <ScreenHeader showBack={canStepBack} onBack={goBack} />
        <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </View>

      {/* No per-step entrance animation: a step paints immediately, scrolled to the top. */}
      <View>
        {step === 1 && <Step1Identity onNext={goNext} />}
        {step === 2 && <Step2Location onNext={goNext} />}
        {step === 3 && <Step3LanguagesNiches onNext={goNext} />}
        {step === 4 && <Step4SocialAccounts onNext={goNext} />}
        {step === 5 && <Step5Photos onNext={goNext} />}
        {step === 6 && <Step6Phone onNext={goNext} />}
        {step === 7 && <Step7FirstPackage onNext={goNext} onSkip={goNext} />}
      </View>
    </Screen>
  );
}
