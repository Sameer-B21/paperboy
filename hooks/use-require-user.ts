import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { getOnboardingStep, getUserId } from '@/data/session';

type RequireUserState = {
  hasUser: boolean;
  isChecking: boolean;
};

export function useRequireUser(options?: { allowUserId?: string | null }): RequireUserState {
  const router = useRouter();
  const [hasUser, setHasUser] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;
    void (async () => {
      if (options?.allowUserId && options.allowUserId.trim()) {
        setHasUser(true);
        setIsChecking(false);
        return;
      }
      const userId = await getUserId();
      if (!isActive) {
        return;
      }
      if (!userId) {
        setHasUser(false);
        router.replace('/onboarding/connect');
        setIsChecking(false);
        return;
      } else {
        setHasUser(true);
      }
      const onboardingStep = await getOnboardingStep();
      if (!isActive) {
        return;
      }
      if (onboardingStep && onboardingStep !== 'complete') {
        router.replace(`/onboarding/${onboardingStep}`);
      }
      setIsChecking(false);
    })();
    return () => {
      isActive = false;
    };
  }, [options?.allowUserId, router]);

  return { hasUser, isChecking };
}
