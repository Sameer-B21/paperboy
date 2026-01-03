import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'newsletterpodcaster.userId';
const USER_EMAIL_KEY = 'newsletterpodcaster.userEmail';
const TTS_VOICE_KEY = 'newsletterpodcaster.ttsVoice';
const ONBOARDING_STEP_KEY = 'newsletterpodcaster.onboardingStep';
const PODCAST_DURATION_KEY = 'newsletterpodcaster.podcastDurationMinutes';

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function setUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearUserId(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getUserEmail(): Promise<string | null> {
  return AsyncStorage.getItem(USER_EMAIL_KEY);
}

export async function setUserEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(USER_EMAIL_KEY, email);
}

export async function clearUserEmail(): Promise<void> {
  await AsyncStorage.removeItem(USER_EMAIL_KEY);
}

export async function getTtsVoice(): Promise<string | null> {
  return AsyncStorage.getItem(TTS_VOICE_KEY);
}

export async function setTtsVoice(voice: string): Promise<void> {
  await AsyncStorage.setItem(TTS_VOICE_KEY, voice);
}

export async function clearTtsVoice(): Promise<void> {
  await AsyncStorage.removeItem(TTS_VOICE_KEY);
}

export async function getOnboardingStep(): Promise<string | null> {
  return AsyncStorage.getItem(ONBOARDING_STEP_KEY);
}

export async function setOnboardingStep(step: string): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step);
}

export async function clearOnboardingStep(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
}

export async function getPodcastDurationMinutes(): Promise<string | null> {
  return AsyncStorage.getItem(PODCAST_DURATION_KEY);
}

export async function setPodcastDurationMinutes(minutes: string): Promise<void> {
  await AsyncStorage.setItem(PODCAST_DURATION_KEY, minutes);
}

export async function clearPodcastDurationMinutes(): Promise<void> {
  await AsyncStorage.removeItem(PODCAST_DURATION_KEY);
}
