/**
 * Input validation utilities for API endpoints
 */

/**
 * Validates UUID v4 format
 */
export function isValidUUID(value: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

/**
 * Validates email format
 */
export function isValidEmail(value: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(value) && value.length <= 254;
}

/**
 * Validates phone number (various formats including US phone numbers)
 */
export function isValidPhoneNumber(value: string): boolean {
	// Remove common separators
	const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
	
	// Allow optional + at start, then 10-15 digits
	const phoneRegex = /^\+?[0-9]{10,15}$/;
	return phoneRegex.test(cleaned);
}

/**
 * Validates URL format
 */
export function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Sanitizes and limits string length
 */
export function sanitizeString(value: string, maxLength: number): string {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim().slice(0, maxLength);
}

interface ValidationResult {
	valid: boolean;
	errors?: string[];
}

interface ChatHistoryValidationResult extends ValidationResult {
	session?: string;
	limit?: number;
}

/**
 * Validates POST /api/track payload
 */
export function validateTrackingPayload(data: any): ValidationResult {
	const errors: string[] = [];

	// Type must be present
	if (!data.type || typeof data.type !== 'string') {
		errors.push('type is required and must be a string');
	} else if (data.type.length > 100) {
		errors.push('type must be 100 characters or less');
	}

	// Session ID validation (either session_id or session)
	const sessionId = data.session_id || data.session;
	if (!sessionId || typeof sessionId !== 'string') {
		errors.push('session_id or session is required');
	} else if (sessionId !== 'unknown' && !isValidUUID(sessionId)) {
		errors.push('session_id must be a valid UUID');
	}

	// Page URL validation (either page_url or page)
	const pageUrl = data.page_url || data.page;
	if (pageUrl && typeof pageUrl !== 'string') {
		errors.push('page_url must be a string');
	} else if (pageUrl && pageUrl.length > 2048) {
		errors.push('page_url must be 2048 characters or less');
	}

	// Event type validation
	if (data.event_type && typeof data.event_type !== 'string') {
		errors.push('event_type must be a string');
	} else if (data.event_type && data.event_type.length > 100) {
		errors.push('event_type must be 100 characters or less');
	}

	// Metric validation (for web vitals)
	if (data.metric && typeof data.metric !== 'string') {
		errors.push('metric must be a string');
	} else if (data.metric && data.metric.length > 100) {
		errors.push('metric must be 100 characters or less');
	}

	// Value validation (for web vitals)
	if (data.value !== undefined && typeof data.value !== 'number') {
		errors.push('value must be a number');
	}

	// Rating validation
	if (data.rating && typeof data.rating !== 'string') {
		errors.push('rating must be a string');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined
	};
}

/**
 * Validates POST /api/chat payload
 */
export function validateChatPayload(data: any): ValidationResult {
	const errors: string[] = [];

	// Message is required
	if (!data.message || typeof data.message !== 'string') {
		errors.push('message is required and must be a string');
	} else if (data.message.length > 5000) {
		errors.push('message must be 5000 characters or less');
	}

	// Session is required and must be UUID
	if (!data.session || typeof data.session !== 'string') {
		errors.push('session is required and must be a string');
	} else if (!isValidUUID(data.session)) {
		errors.push('session must be a valid UUID');
	}

	// Page is optional but must be string if provided
	if (data.page && typeof data.page !== 'string') {
		errors.push('page must be a string');
	} else if (data.page && data.page.length > 2048) {
		errors.push('page must be 2048 characters or less');
	}

	// Stream is optional boolean
	if (data.stream !== undefined && typeof data.stream !== 'boolean') {
		errors.push('stream must be a boolean');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined
	};
}

/**
 * Validates GET /api/chat/history query parameters
 */
export function validateChatHistoryParams(
	session: string | null,
	limit: string | null
): ChatHistoryValidationResult {
	const errors: string[] = [];

	// Session is required
	if (!session) {
		errors.push('session query parameter is required');
	} else if (!isValidUUID(session)) {
		errors.push('session must be a valid UUID');
	}

	// Parse and validate limit
	let parsedLimit = 10; // default
	if (limit) {
		parsedLimit = parseInt(limit, 10);
		if (isNaN(parsedLimit) || parsedLimit < 1) {
			errors.push('limit must be a positive integer');
			parsedLimit = 10;
		} else if (parsedLimit > 100) {
			errors.push('limit must be 100 or less');
			parsedLimit = 100;
		}
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
		session: session || undefined,
		limit: parsedLimit
	};
}

/**
 * Validates POST /api/estimate payload
 */
export function validateEstimatePayload(data: any): ValidationResult {
	const errors: string[] = [];

	// Name is required
	if (!data.name || typeof data.name !== 'string') {
		errors.push('name is required and must be a string');
	} else if (data.name.trim().length === 0) {
		errors.push('name cannot be empty');
	} else if (data.name.length > 200) {
		errors.push('name must be 200 characters or less');
	}

	// Phone is required and must be valid
	if (!data.phone || typeof data.phone !== 'string') {
		errors.push('phone is required and must be a string');
	} else if (!isValidPhoneNumber(data.phone)) {
		errors.push('phone must be a valid phone number');
	}

	// Email is optional but must be valid if provided
	if (data.email) {
		if (typeof data.email !== 'string') {
			errors.push('email must be a string');
		} else if (data.email.trim().length > 0 && !isValidEmail(data.email)) {
			errors.push('email must be a valid email address');
		}
	}

	// Service is required
	if (!data.service || typeof data.service !== 'string') {
		errors.push('service is required and must be a string');
	} else if (data.service.length > 200) {
		errors.push('service must be 200 characters or less');
	}

	// Message is optional
	if (data.message && typeof data.message !== 'string') {
		errors.push('message must be a string');
	} else if (data.message && data.message.length > 5000) {
		errors.push('message must be 5000 characters or less');
	}

	// Session validation (optional, but must be UUID if provided)
	if (data.session && typeof data.session !== 'string') {
		errors.push('session must be a string');
	} else if (data.session && !isValidUUID(data.session)) {
		errors.push('session must be a valid UUID');
	}

	// Page validation (optional)
	if (data.page && typeof data.page !== 'string') {
		errors.push('page must be a string');
	} else if (data.page && data.page.length > 2048) {
		errors.push('page must be 2048 characters or less');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined
	};
}
