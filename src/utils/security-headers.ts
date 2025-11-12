/**
 * Security headers utility for applying comprehensive HTTP security headers
 */

/**
 * Returns a complete set of security headers
 */
export function getSecurityHeaders(): Record<string, string> {
	return {
		// Content Security Policy - Allow inline scripts/styles (needed for chat widget), Workers AI, Cloudflare services
		'Content-Security-Policy': [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
			"style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
			"img-src 'self' data: https: blob:",
			"connect-src 'self' https://gateway.ai.cloudflare.com https://api.cloudflare.com",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; '),

		// Prevent clickjacking
		'X-Frame-Options': 'DENY',

		// Prevent MIME type sniffing
		'X-Content-Type-Options': 'nosniff',

		// Referrer policy
		'Referrer-Policy': 'strict-origin-when-cross-origin',

		// Permissions Policy (Feature Policy) - Restrict powerful features
		'Permissions-Policy': [
			'camera=()',
			'microphone=()',
			'geolocation=()',
			'payment=()',
			'usb=()',
			'magnetometer=()'
		].join(', '),

		// HTTP Strict Transport Security (HSTS)
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

		// Remove Server header information
		'X-Powered-By': 'Cloudflare Workers'
	};
}

/**
 * Applies security headers to a Response object, optionally merging with additional headers
 */
export function applySecurityHeaders(
	response: Response,
	additionalHeaders?: Record<string, string>
): Response {
	const securityHeaders = getSecurityHeaders();
	const newHeaders = new Headers(response.headers);

	// Apply security headers
	Object.entries(securityHeaders).forEach(([key, value]) => {
		newHeaders.set(key, value);
	});

	// Apply additional headers if provided
	if (additionalHeaders) {
		Object.entries(additionalHeaders).forEach(([key, value]) => {
			newHeaders.set(key, value);
		});
	}

	// Clone response with new headers
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders
	});
}
