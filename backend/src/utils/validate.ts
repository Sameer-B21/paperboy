export function requireString(value: unknown, field: string): string {
  if (!value || typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

export function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}
