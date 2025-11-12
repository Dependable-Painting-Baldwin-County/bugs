/**
 * Request validation middleware for size, content-type, and JSON parsing
 */

import {
	handleRequestTooLarge,
	handleInvalidContentType,
	handleMethodNotAllowed,
	createErrorResponse
} from './error-handler';

const MAX_REQUEST_SIZE = 102400; // 100KB in bytes

interface ValidationResult {
	valid: boolean;
	error?: Response;
}

interface ParseResult {
	data?: any;
	error?: Response;
}

/**
 * Validates request size based on Content-Length header
 */
export function validateRequestSize(request: Request): ValidationResult {
	const contentLength = request.headers.get('Content-Length');
	
	if (contentLength) {
		const size = parseInt(contentLength, 10);
		if (size > MAX_REQUEST_SIZE) {
			return {
				valid: false,
				error: handleRequestTooLarge()
			};
		}
	}
	
	return { valid: true };
}

/**
 * Validates Content-Type header for POST requests
 */
export function validateContentType(request: Request): ValidationResult {
	const contentType = request.headers.get('Content-Type');
	
	if (!contentType || !contentType.includes('application/json')) {
		return {
			valid: false,
			error: handleInvalidContentType()
		};
	}
	
	return { valid: true };
}

/**
 * Validates HTTP method against allowed methods
 */
export function validateRequestMethod(
	request: Request,
	allowedMethods: string[]
): ValidationResult {
	if (!allowedMethods.includes(request.method)) {
		return {
			valid: false,
			error: handleMethodNotAllowed(allowedMethods)
		};
	}
	
	return { valid: true };
}

/**
 * Safely parses JSON from request body with error handling
 */
export async function parseJsonSafely(request: Request): Promise<ParseResult> {
	try {
		// Clone the request so body can be read
		const clonedRequest = request.clone();
		
		// Read the body as text first to check size
		const text = await clonedRequest.text();
		
		// Check size (in case Content-Length header was missing)
		if (text.length > MAX_REQUEST_SIZE) {
			return {
				error: handleRequestTooLarge()
			};
		}
		
		// Parse JSON
		const data = JSON.parse(text);
		
		return { data };
		
	} catch (error) {
		return {
			error: createErrorResponse(
				400,
				'Invalid JSON',
				'Request body must be valid JSON.'
			)
		};
	}
}
