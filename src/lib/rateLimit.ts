type Bucket = { count: number; resetAt: number };

// Simple in-memory fixed-window limiter. Per-process only (resets on deploy/restart,
// not shared across instances) — enough to blunt casual abuse of a paid API quota
// behind a public endpoint without adding external infrastructure.
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
