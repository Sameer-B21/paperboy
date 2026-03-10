import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getOnboardingStep, getUserId } from '@/data/session';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    void (async () => {
      const userId = await getUserId();
      const onboardingStep = await getOnboardingStep();
      if (!isActive) {
        return;
      }
      if (!userId) {
        setTarget('/onboarding/connect');
        return;
      }
      if (!onboardingStep || onboardingStep === 'complete') {
        setTarget('/today');
        return;
      }
      setTarget(`/onboarding/${onboardingStep}`);
    })();
    return () => {
      isActive = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});
