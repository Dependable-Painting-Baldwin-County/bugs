/**
 * Rate limiting utility using KV storage
 */

export interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
}

// Rate limit configurations for different endpoints
export const CHAT_LIMIT: RateLimitConfig = {
	maxRequests: 20,
	windowMs: 3600000 // 1 hour
};

export const TRACK_LIMIT: RateLimitConfig = {
	maxRequests: 100,
	windowMs: 3600000 // 1 hour
};

export const ESTIMATE_LIMIT: RateLimitConfig = {
	maxRequests: 5,
	windowMs: 3600000 // 1 hour
};

export const HISTORY_LIMIT: RateLimitConfig = {
	maxRequests: 30,
	windowMs: 3600000 // 1 hour
};

interface RateLimitData {
	count: number;
	resetTime: number;
}

interface RateLimitResult {
	allowed: boolean;
	retryAfter?: number;
}

/**
 * Checks and updates rate limit for a session/endpoint combination
 */
export async function checkRateLimit(
	kv: KVNamespace,
	sessionId: string,
	endpoint: string,
	config: RateLimitConfig
): Promise<RateLimitResult> {
	const key = `ratelimit:${endpoint}:${sessionId}`;
	const now = Date.now();

	try {
		// Get existing rate limit data
		const existing = await kv.get<RateLimitData>(key, 'json');

		if (!existing) {
			// First request - create new entry
			const newData: RateLimitData = {
				count: 1,
				resetTime: now + config.windowMs
			};

			await kv.put(key, JSON.stringify(newData), {
				expirationTtl: Math.ceil(config.windowMs / 1000)
			});

			return { allowed: true };
		}

		// Check if window has expired
		if (now >= existing.resetTime) {
			// Window expired - reset counter
			const newData: RateLimitData = {
				count: 1,
				resetTime: now + config.windowMs
			};

			await kv.put(key, JSON.stringify(newData), {
				expirationTtl: Math.ceil(config.windowMs / 1000)
			});

			return { allowed: true };
		}

		// Window is still active - check if limit exceeded
		if (existing.count >= config.maxRequests) {
			const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
			return {
				allowed: false,
				retryAfter
			};
		}

		// Increment counter
		const updatedData: RateLimitData = {
			count: existing.count + 1,
			resetTime: existing.resetTime
		};

		await kv.put(key, JSON.stringify(updatedData), {
			expirationTtl: Math.ceil((existing.resetTime - now) / 1000)
		});

		return { allowed: true };

	} catch (error) {
		// On error, allow the request but log the error
		console.error('Rate limit check failed:', error);
		return { allowed: true };
	}
}
