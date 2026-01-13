import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  role: string;
}

interface CachedUser {
  id: string;
  email: string;
  role: string;
  companyId: string | null;
  cachedAt: number;
}

// Simple in-memory cache for validated users
// This dramatically reduces DB queries for repeated requests
const USER_CACHE = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const MAX_CACHE_SIZE = 1000; // Max cached users

/**
 * Clean up expired cache entries periodically
 */
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of USER_CACHE.entries()) {
    if (now - value.cachedAt > CACHE_TTL_MS) {
      USER_CACHE.delete(key);
    }
  }
  // If cache is too large, remove oldest entries
  if (USER_CACHE.size > MAX_CACHE_SIZE) {
    const entries = Array.from(USER_CACHE.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.slice(0, USER_CACHE.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => USER_CACHE.delete(key));
  }
};

// Clean up cache every 30 seconds
setInterval(cleanupCache, 30 * 1000);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;

    // Check cache first
    const cached = USER_CACHE.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return {
        id: cached.id,
        email: cached.email,
        role: cached.role,
        companyId: cached.companyId,
      };
    }

    // Cache miss - fetch from database
    const user = await this.authService.validateUser(userId);

    if (!user) {
      // Remove from cache if user is no longer valid
      USER_CACHE.delete(userId);
      throw new UnauthorizedException();
    }

    // Cache the validated user
    const cachedUser: CachedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      cachedAt: Date.now(),
    };
    USER_CACHE.set(userId, cachedUser);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}

/**
 * Invalidate a user's cache entry (call this after user updates)
 */
export const invalidateUserCache = (userId: string): void => {
  USER_CACHE.delete(userId);
};

/**
 * Clear the entire user cache
 */
export const clearUserCache = (): void => {
  USER_CACHE.clear();
};
