export function toIsoDate(timestamp?: number | null): string | null {
  if (!timestamp) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
