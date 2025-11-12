/**
 * CORS utility functions for origin validation and header management
 */

const PRODUCTION_ORIGINS = [
	'https://dependablepainting.work',
	'https://www.dependablepainting.work'
];

/**
 * Returns the list of allowed origins including production domains and localhost for development
 */
export function getAllowedOrigins(): string[] {
	return [...PRODUCTION_ORIGINS];
}

/**
 * Validates if an origin is allowed (production domains or localhost for development)
 */
export function isOriginAllowed(origin: string | null): boolean {
	if (!origin) {
		return false;
	}

	// Check production origins
	if (PRODUCTION_ORIGINS.includes(origin)) {
		return true;
	}

	// Allow localhost for development (http://localhost:*, http://127.0.0.1:*)
	if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
		return true;
	}

	return false;
}

/**
 * Returns CORS headers if the origin is allowed, otherwise returns empty headers
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
	if (!isOriginAllowed(origin)) {
		return {};
	}

	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400', // 24 hours
		'Vary': 'Origin'
	};
}

/**
 * Handles CORS preflight (OPTIONS) requests with origin validation
 */
export function handleCorsPreflightRequest(request: Request): Response {
	const origin = request.headers.get('Origin');

	if (!isOriginAllowed(origin)) {
		return new Response('Origin not allowed', {
			status: 403,
			headers: { 'Content-Type': 'text/plain' }
		});
	}

	const corsHeaders = getCorsHeaders(origin);

	return new Response(null, {
		status: 204,
		headers: corsHeaders
	});
}
