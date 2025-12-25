const normalizeBaseUrl = (value: string) => {
  if (value.endsWith('/')) {
    return value.slice(0, -1);
  }
  return value;
};

export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'
);
