import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from 'expo-av';

const STORAGE_PREFIX = 'newsletterpodcaster.playback.';
const SAVE_INTERVAL_MS = 2000;

let sharedSound: Audio.Sound | null = null;
let currentUrl: string | null = null;
let statusHandler: ((status: AVPlaybackStatus) => void) | null = null;
let lastSavedAt = 0;
let lastSavedPosition = 0;
let previewSound: Audio.Sound | null = null;

type StoredPlayback = {
  positionMillis: number;
  durationMillis?: number | null;
  updatedAt: number;
};

const maybePersistStatus = (status: AVPlaybackStatus) => {
  if (!status.isLoaded || !currentUrl) {
    return;
  }
  const now = Date.now();
  const position = status.positionMillis ?? 0;
  const shouldSave =
    status.didJustFinish ||
    Math.abs(position - lastSavedPosition) >= 1000 ||
    now - lastSavedAt >= SAVE_INTERVAL_MS;

  if (!shouldSave) {
    return;
  }

  lastSavedAt = now;
  lastSavedPosition = position;
  const payload: StoredPlayback = {
    positionMillis: position,
    durationMillis: status.durationMillis ?? null,
    updatedAt: now,
  };
  void AsyncStorage.setItem(`${STORAGE_PREFIX}${currentUrl}`, JSON.stringify(payload));
};

const handleStatusUpdate = (status: AVPlaybackStatus) => {
  maybePersistStatus(status);
  if (statusHandler) {
    statusHandler(status);
  }
};

export async function configureAudioMode(): Promise<void> {
  const iosInterruptionMode =
    typeof InterruptionModeIOS === 'undefined' ? 2 : InterruptionModeIOS.DuckOthers;
  const androidInterruptionMode =
    typeof InterruptionModeAndroid === 'undefined' ? 2 : InterruptionModeAndroid.DuckOthers;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    interruptionModeIOS: iosInterruptionMode,
    interruptionModeAndroid: androidInterruptionMode,
    shouldDuckAndroid: true,
  });
}

export function setPlaybackStatusHandler(handler: ((status: AVPlaybackStatus) => void) | null) {
  statusHandler = handler;
}

export async function ensureSharedSound(uri: string): Promise<Audio.Sound> {
  if (sharedSound && currentUrl === uri) {
    return sharedSound;
  }
  if (sharedSound) {
    await sharedSound.unloadAsync();
  }
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false },
    handleStatusUpdate,
    true
  );
  sound.setOnPlaybackStatusUpdate(handleStatusUpdate);
  sharedSound = sound;
  currentUrl = uri;
  lastSavedAt = 0;
  lastSavedPosition = 0;
  return sound;
}

export async function stopSharedSound(): Promise<void> {
  if (!sharedSound) {
    return;
  }
  try {
    await sharedSound.stopAsync();
  } catch {
    // Ignore stop errors on unloaded audio.
  }
  try {
    await sharedSound.unloadAsync();
  } catch {
    // Ignore unload errors.
  }
  sharedSound = null;
  currentUrl = null;
}

export async function stopPreviewSound(): Promise<void> {
  if (!previewSound) {
    return;
  }
  try {
    await previewSound.stopAsync();
  } catch {
    // Ignore stop errors on unloaded audio.
  }
  try {
    await previewSound.unloadAsync();
  } catch {
    // Ignore unload errors.
  }
  previewSound = null;
}

export async function playPreview(uri: string): Promise<void> {
  await configureAudioMode();
  await stopSharedSound();
  await stopPreviewSound();
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  previewSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) {
      return;
    }
    if (status.didJustFinish) {
      void stopPreviewSound();
    }
  });
}

export async function getSharedStatus(): Promise<AVPlaybackStatus | null> {
  if (!sharedSound) {
    return null;
  }
  try {
    return await sharedSound.getStatusAsync();
  } catch {
    return null;
  }
}

export async function getSavedPlaybackPosition(uri: string): Promise<StoredPlayback | null> {
  try {
    const stored = await AsyncStorage.getItem(`${STORAGE_PREFIX}${uri}`);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as StoredPlayback;
  } catch {
    return null;
  }
}

export async function clearSavedPlaybackPosition(uri: string): Promise<void> {
  await AsyncStorage.removeItem(`${STORAGE_PREFIX}${uri}`);
}
