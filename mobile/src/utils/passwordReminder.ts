const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export function shouldShowPasswordReminder(passwordChangedAt: string | null): boolean {
  if (!passwordChangedAt) return true;
  const changed = new Date(passwordChangedAt).getTime();
  return Date.now() - changed >= SIX_MONTHS_MS;
}
