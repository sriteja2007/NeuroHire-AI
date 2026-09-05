import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
});

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  if (req.nextUrl.pathname.startsWith('/api')) {
    const ip = req.headers.get("x-forwarded-for") ?? '127.0.0.1';
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      if (!success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        });
      }
    } catch (error) {
      console.warn('Rate limiter failed or not configured:', error);
    }
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
