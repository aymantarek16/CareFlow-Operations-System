/**
 * Client-side throttling primitives.
 *
 * **Important:** these helpers are NOT a substitute for server-side rate
 * limiting. Real abuse protection lives in Supabase Auth (which already
 * throttles login / signup) and in any server-side functions you add later.
 * This file exists only to:
 *
 *   - Block accidental rapid clicks (double-submit on flaky networks).
 *   - Discourage casual bots that ignore disabled buttons.
 *   - Add a soft cool-down after repeated failures (e.g. login).
 *
 * State is held in module memory so it resets on page reload — by design,
 * because we don't want to leave permanent fingerprints in localStorage.
 */

type Bucket = {
  count: number;
  windowStart: number;
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Attempt an action under a sliding window.
 *
 * @param key     Stable identifier for the action (e.g. "login", "register").
 * @param max     How many attempts are allowed in the window.
 * @param windowMs Window duration in milliseconds.
 * @param cooldownMs How long to block once `max` is exceeded.
 * @returns       `{ allowed: true }` if the call may proceed, otherwise
 *                `{ allowed: false, retryAfterMs }` with seconds to wait.
 */
export function tryAction(
  key: string,
  max: number,
  windowMs: number,
  cooldownMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { count: 0, windowStart: now, blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  if (bucket.blockedUntil > now) {
    return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
  }

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;
  if (bucket.count > max) {
    bucket.blockedUntil = now + cooldownMs;
    return { allowed: false, retryAfterMs: cooldownMs };
  }

  return { allowed: true };
}

/** Manually clear a bucket (e.g. after a successful login). */
export function clearBucket(key: string): void {
  buckets.delete(key);
}

/** Format a millisecond duration as Arabic text for user-facing messages. */
export function formatRetryAfter(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec} ثانية`;
  const min = Math.ceil(sec / 60);
  return `${min} دقيقة`;
}
