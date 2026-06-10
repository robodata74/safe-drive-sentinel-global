const ipMap = new Map<string, { count: number; ts: number }>();

const WINDOW_MS = 60_000; // 1 min
const LIMIT = 20; // 20 requests/min per IP

export function rateLimit(ip: string) {
  const now = Date.now();

  const record = ipMap.get(ip);

  if (!record) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (now - record.ts > WINDOW_MS) {
    ipMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (record.count >= LIMIT) {
    return false;
  }

  record.count += 1;
  return true;
}
