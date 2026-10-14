import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import {
  CREATOR_DASHBOARD_QUERY_KEY,
  CREATOR_PACKAGES_QUERY_KEY,
  CREATOR_PROFILE_QUERY_KEY,
} from '@/lib/query-keys';
import { toast } from '@/lib/toast';

const TOTAL_STEPS = 7;

/**
 * Creator Profile Setup Wizard (prompt.md §6.2). Three ways in, chosen by the `mode` param:
 * - none: first-run onboarding, step 1 → 7 then the success screen, ending on Home;
 * - `resume`: from the profile screen's "Continue setup", starting at the first unfinished step
 *   and returning to the profile screen at the end;
 * - `edit`: one step opened from the profile screen, saved with "Save" and closed.
 * The profile screen fills the wizard store from the saved profile (`hydrate`) before opening it.
 */
export default function CreatorWizardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mode } = useLocalSearchParams<{ mode?: 'edit' | 'resume' }>();
  const step = useCreatorWizardStore((s) => s.step);
  const setStep = useCreatorWizardStore((s) => s.setStep);
  // Where this visit started — Back from here leaves the wizard instead of stepping back.
  const [entryStep] = useState(step);

  const isEdit = mode === 'edit';
  const isResume = mode === 'resume';
  const isSuccessScreen = step > TOTAL_STEPS;
  const canStepBack = !isEdit && !isSuccessScreen && step > (isResume ? entryStep : 1);

  function refreshProfileQueries() {
    queryClient.invalidateQueries({ queryKey: CREATOR_PROFILE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: CREATOR_DASHBOARD_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: CREATOR_PACKAGES_QUERY_KEY });
  }

  function goNext() {
    refreshProfileQueries();
    if (isEdit) {
      toast.success('Saved');
      router.back();
      return;
    }
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
    if (isResume) {
      router.back();
      return;
    }
    // Back to Home if the wizard was opened from there; otherwise Home replaces this screen.
    router.dismissTo('/creator/home');
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
          {isResume ? 'Back to profile' : 'Go to My Dashboard'}
        </Button>
      </Screen>
    );
  }

  const submitLabel = isEdit ? 'Save' : 'Continue';

  return (
    <Screen scroll keyboardAvoiding scrollResetKey={step} contentClassName="gap-8 pt-2">
      <View className="gap-3">
        <ScreenHeader
          // Onboarding hides Back on step 1; from the profile screen Back always leaves.
          showBack={canStepBack || isEdit || isResume}
          onBack={canStepBack ? goBack : () => router.back()}
        />
        {isEdit ? (
          <Text variant="caption" color="secondary">
            Step {step} of {TOTAL_STEPS}
          </Text>
        ) : (
          <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
        )}
      </View>

      {/* No per-step entrance animation: a step paints immediately, scrolled to the top. */}
      <View>
        {step === 1 && <Step1Identity onNext={goNext} submitLabel={submitLabel} />}
        {step === 2 && <Step2Location onNext={goNext} submitLabel={submitLabel} />}
        {step === 3 && <Step3LanguagesNiches onNext={goNext} submitLabel={submitLabel} />}
        {step === 4 && <Step4SocialAccounts onNext={goNext} submitLabel={submitLabel} />}
        {step === 5 && <Step5Photos onNext={goNext} submitLabel={submitLabel} />}
        {step === 6 && <Step6Phone onNext={goNext} />}
        {step === 7 && <Step7FirstPackage onNext={goNext} onSkip={goNext} />}
      </View>
    </Screen>
  );
}
