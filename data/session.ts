import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'newsletterpodcaster.userId';
const USER_EMAIL_KEY = 'newsletterpodcaster.userEmail';
const TTS_VOICE_KEY = 'newsletterpodcaster.ttsVoice';

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
