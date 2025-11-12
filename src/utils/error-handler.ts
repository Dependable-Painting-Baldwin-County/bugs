/**
 * Error handling utilities for standardized error responses
 */

import { applySecurityHeaders } from './security-headers';

export interface ErrorResponse {
	error: string;
	message?: string;
}

/**
 * Creates a standardized error response with security headers
 */
export function createErrorResponse(
	status: number,
	error: string,
	message?: string,
	additionalHeaders?: Record<string, string>
): Response {
	const body: ErrorResponse = { error };
	if (message) {
		body.message = message;
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...additionalHeaders
	};

	const response = new Response(JSON.stringify(body), {
		status,
		headers
	});

	return applySecurityHeaders(response);
}

/**
 * Safely logs errors to console with context, sanitizing sensitive data
 */
export function logError(context: string, error: unknown): void {
	const timestamp = new Date().toISOString();
	
	if (error instanceof Error) {
		console.error(`[${timestamp}] ${context}:`, {
			message: error.message,
			name: error.name,
			// Exclude stack trace in production to avoid logging sensitive paths
		});
	} else {
		console.error(`[${timestamp}] ${context}:`, String(error));
	}
}

/**
 * Returns a generic error response for database errors
 */
export function handleDatabaseError(error: unknown): Response {
	logError('Database Error', error);
	
	return createErrorResponse(
		500,
		'Database error',
		'An error occurred while processing your request. Please try again later.'
	);
}

/**
 * Returns a service unavailable response for AI service errors
 */
export function handleAIError(error: unknown): Response {
	logError('AI Service Error', error);
	
	return createErrorResponse(
		503,
		'AI service unavailable',
		'The AI service is temporarily unavailable. Please try again in a moment.'
	);
}

/**
 * Returns a bad request response with validation errors
 */
export function handleValidationError(errors: string[]): Response {
	return createErrorResponse(
		400,
		'Validation error',
		errors.join('; ')
	);
}

/**
 * Returns a rate limit exceeded response with Retry-After header
 */
export function handleRateLimitError(retryAfter: number): Response {
	return createErrorResponse(
		429,
		'Rate limit exceeded',
		'Too many requests. Please try again later.',
		{
			'Retry-After': String(retryAfter)
		}
	);
}

/**
 * Returns an origin not allowed response
 */
export function handleOriginNotAllowed(): Response {
	return createErrorResponse(
		403,
		'Origin not allowed',
		'Your origin is not authorized to access this resource.'
	);
}

/**
 * Returns a request too large response
 */
export function handleRequestTooLarge(): Response {
	return createErrorResponse(
		413,
		'Request too large',
		'The request payload is too large. Maximum size is 100KB.'
	);
}

/**
 * Returns an invalid content type response
 */
export function handleInvalidContentType(): Response {
	return createErrorResponse(
		415,
		'Invalid content type',
		'Content-Type must be application/json for POST requests.'
	);
}

/**
 * Returns a method not allowed response
 */
export function handleMethodNotAllowed(allowed: string[]): Response {
	return createErrorResponse(
		405,
		'Method not allowed',
		`Only ${allowed.join(', ')} methods are allowed.`,
		{
			'Allow': allowed.join(', ')
		}
	);
}

/**
 * Returns a generic internal server error response
 */
export function handleInternalError(error: unknown): Response {
	logError('Internal Server Error', error);
	
	return createErrorResponse(
		500,
		'Internal server error',
		'An unexpected error occurred. Please try again.'
	);
}
