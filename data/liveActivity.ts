import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

/**
 * Check whether the native Live Activity module is available.
 * Returns false on Android or if the native module wasn't linked.
 */
function isAvailable(): boolean {
  return Platform.OS === 'ios' && LiveActivityModule != null;
}

/**
 * Start a new Live Activity on the Lock Screen / Dynamic Island.
 *
 * @param params.title   – Headline shown in the activity (e.g. "Tech News Brief")
 * @param params.status  – Initial status text (default: "Starting...")
 * @param params.progress – Initial progress 0.0–1.0 (default: 0)
 * @returns The activity ID string, or null if unavailable.
 */
async function start(params: {
  title: string;
  status?: string;
  progress?: number;
}): Promise<string | null> {
  if (!isAvailable()) return null;
  try {
    const activityId: string = await LiveActivityModule.startActivity(
      params.title,
      params.status ?? 'Starting...',
      params.progress ?? 0,
    );
    return activityId;
  } catch (error) {
    console.warn('[LiveActivity] start failed:', error);
    return null;
  }
}

/**
 * Update the currently-running Live Activity.
 *
 * @param params.status    – New status text
 * @param params.progress  – New progress 0.0–1.0
 * @param params.isPlaying – Whether audio is currently playing
 */
async function update(params: {
  status?: string;
  progress?: number;
  isPlaying?: boolean;
}): Promise<void> {
  if (!isAvailable()) return;
  try {
    await LiveActivityModule.updateActivity(
      params.status ?? '',
      params.progress ?? 0,
      params.isPlaying ?? false,
    );
  } catch (error) {
    console.warn('[LiveActivity] update failed:', error);
  }
}

/**
 * End the currently-running Live Activity.
 *
 * @param params.status – Final status text (default: "Complete")
 */
async function end(params?: { status?: string }): Promise<void> {
  if (!isAvailable()) return;
  try {
    await LiveActivityModule.endActivity(params?.status ?? 'Complete');
  } catch (error) {
    console.warn('[LiveActivity] end failed:', error);
  }
}

export const LiveActivity = {
  isAvailable,
  start,
  update,
  end,
};
