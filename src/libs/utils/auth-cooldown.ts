const COOLDOWN_DURATION = 60;

export { COOLDOWN_DURATION };

export function getCooldownKey(prefix: string, email: string): string {
  return `${prefix}_${email}`;
}

export function getCooldownExpiry(prefix: string, email: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(getCooldownKey(prefix, email));
  return stored ? Number.parseInt(stored, 10) : null;
}

export function setCooldownExpiry(prefix: string, email: string, expiry: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(getCooldownKey(prefix, email), expiry.toString());
}

export function getRemainingCooldown(prefix: string, email: string): number {
  const expiry = getCooldownExpiry(prefix, email);
  if (!expiry) {
    return 0;
  }
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}
