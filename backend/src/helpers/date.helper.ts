export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60);
}

export function addDays(date: Date, days: number): Date {
  return addSeconds(date, days * 86400);
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** Parses simple "15m" / "30d" / "1h" style duration strings (as used for JWT expiresIn) into milliseconds. */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration.trim());
  if (!match) throw new Error(`Invalid duration string: ${duration}`);
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}
