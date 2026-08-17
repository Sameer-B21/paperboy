import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

//SecureStore has no web implementation, so the web build falls back to
//AsyncStorage (localStorage) for the session token
const canUseSecureStore = Platform.OS !== 'web';

const AUTH_TOKEN_KEY = 'newsletterpodcaster.authToken';
const USER_EMAIL_KEY = 'newsletterpodcaster.userEmail';
const USER_NAME_KEY = 'newsletterpodcaster.userName';
const TTS_VOICE_KEY = 'newsletterpodcaster.ttsVoice';
const ONBOARDING_STEP_KEY = 'newsletterpodcaster.onboardingStep';
const PODCAST_DURATION_KEY = 'newsletterpodcaster.podcastDurationMinutes';
const DELIVERY_HOUR_KEY = 'newsletterpodcaster.deliveryHour';

//the session token is a credential, so it lives in the device keychain
//(SecureStore) rather than plaintext AsyncStorage
export async function getAuthToken(): Promise<string | null> {
  if (!canUseSecureStore) {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (!canUseSecureStore) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (!canUseSecureStore) {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
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

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(USER_NAME_KEY);
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(USER_NAME_KEY, name);
}

export async function clearUserName(): Promise<void> {
  await AsyncStorage.removeItem(USER_NAME_KEY);
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

//local hour (0-23) the user wants their daily episode, stored for display
export async function getDeliveryHour(): Promise<string | null> {
  return AsyncStorage.getItem(DELIVERY_HOUR_KEY);
}

export async function setDeliveryHour(hour: string): Promise<void> {
  await AsyncStorage.setItem(DELIVERY_HOUR_KEY, hour);
}

export async function clearDeliveryHour(): Promise<void> {
  await AsyncStorage.removeItem(DELIVERY_HOUR_KEY);
}
