import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    limiter = null;
    return limiter;
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
    prefix: "muninn",
  });

  return limiter;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function checkMuninnRateLimit(ip: string): Promise<boolean> {
  const ratelimit = getLimiter();
  if (!ratelimit) return true;

  const result = await ratelimit.limit(ip);
  return result.success;
}
