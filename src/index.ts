// Import security utilities
import { handleCorsPreflightRequest, getCorsHeaders, isOriginAllowed } from './utils/cors';
import { applySecurityHeaders } from './utils/security-headers';
import {
	validateTrackingPayload,
	validateChatPayload,
	validateChatHistoryParams,
	validateEstimatePayload
} from './utils/validation';
import { checkRateLimit, CHAT_LIMIT, TRACK_LIMIT, ESTIMATE_LIMIT, HISTORY_LIMIT } from './utils/rate-limit';
import {
	handleOriginNotAllowed,
	handleValidationError,
	handleRateLimitError,
	handleDatabaseError,
	handleAIError,
	handleInternalError,
	logError,
	createErrorResponse
} from './utils/error-handler';
import { validateRequestSize, validateContentType, parseJsonSafely } from './utils/request-validator';

interface Env {
	PAINTERS_DB: D1Database;
	CHAT_HISTORY: KVNamespace;
	AI: Ai;
	ANALYTICS_EVENTS?: AnalyticsEngineDataset;
	ASSETS: Fetcher;
}

interface TrackingEvent {
	type: string;
	session_id: string;
	page_url: string;
	event_type: string;
	metric: string;
	value: number;
	rating: string;
	session: string;
	page: string;
}

interface ChatMessage {
	role: 'assistant' | 'user';
	content: string;
}

interface ChatRequest {
	message: string;
	session: string;
	page: string;
	stream?: boolean;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle OPTIONS preflight with origin validation
		if (request.method === 'OPTIONS') {
			return handleCorsPreflightRequest(request);
		}

		try {
			// Get origin for CORS validation on API routes
			const origin = request.headers.get('Origin');

			// Route API endpoints
			if (url.pathname === '/api/track') {
				return await handleTracking(request, env, origin);
			}

			if (url.pathname === '/api/chat') {
				return await handleChat(request, env, origin);
			}

			if (url.pathname === '/api/chat/history') {
				return await handleChatHistory(request, env, origin);
			}

			if (url.pathname === '/api/estimate') {
				return await handleEstimate(request, env, origin);
			}

			// Serve static assets with security headers
			const assetResponse = await env.ASSETS.fetch(request);
			return applySecurityHeaders(assetResponse);

		} catch (error) {
			return handleInternalError(error);
		}
	}
};

function getRequestCf(request: Request): IncomingRequestCf | undefined {
	return (request as Request & { cf?: IncomingRequestCf }).cf;
}

async function handleTracking(
	request: Request,
	env: Env,
	origin: string | null
): Promise<Response> {
	// Validate origin
	if (!isOriginAllowed(origin)) {
		return handleOriginNotAllowed();
	}

	const corsHeaders = getCorsHeaders(origin);

	if (request.method !== 'POST') {
		return createErrorResponse(405, 'Method not allowed', 'Only POST requests are allowed', corsHeaders);
	}

	// Validate request size
	const sizeCheck = validateRequestSize(request);
	if (!sizeCheck.valid) {
		return sizeCheck.error!;
	}

	// Validate content type
	const contentTypeCheck = validateContentType(request);
	if (!contentTypeCheck.valid) {
		return contentTypeCheck.error!;
	}

	try {
		// Parse JSON safely
		const parseResult = await parseJsonSafely(request);
		if (parseResult.error) {
			return parseResult.error;
		}

		const data = parseResult.data as TrackingEvent;

		// Validate payload
		const validation = validateTrackingPayload(data);
		if (!validation.valid) {
			return handleValidationError(validation.errors!);
		}

		// Check rate limit
		const sessionId = data.session_id || data.session || 'unknown';
		const rateLimit = await checkRateLimit(env.CHAT_HISTORY, sessionId, 'track', TRACK_LIMIT);
		if (!rateLimit.allowed) {
			return handleRateLimitError(rateLimit.retryAfter!);
		}

		const cf = getRequestCf(request);
		const city = cf?.city ?? 'Unknown';
		const country = cf?.country ?? 'Unknown';

		const timestamp = new Date().toISOString();
		const eventDate = timestamp.split('T')[0];

		if (data.type === 'web_vital') {
			// Track Core Web Vitals for performance monitoring
			await env.PAINTERS_DB.prepare(`
				INSERT INTO website_events (
					date, session_id, event_type, page_url, timestamp,
					event_date, city, country, user_agent
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				timestamp,
				data.session_id || 'unknown',
				`web_vital_${data.metric}`,
				data.page_url || '',
				timestamp,
				eventDate,
				city,
				country,
				request.headers.get('user-agent') || ''
			).run();

		} else if (data.type === 'page_view') {
			// Capture page views with UTM parameters from ads
			const url = new URL(data.page_url || request.url);
			const utmSource = url.searchParams.get('utm_source') || '';
			const utmMedium = url.searchParams.get('utm_medium') || '';

			await env.PAINTERS_DB.prepare(`
				INSERT INTO website_events (
					date, session_id, event_type, page_url, utm_source, utm_medium,
					timestamp, event_date, city, country, user_agent, page_views
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
			`).bind(
				timestamp,
				data.session_id || 'unknown',
				'page_view',
				data.page_url || url.pathname,
				utmSource,
				utmMedium,
				timestamp,
				eventDate,
				city,
				country,
				request.headers.get('user-agent') || ''
			).run();

		} else if (data.type === 'chat_feedback_up' || data.type === 'chat_feedback_down') {
			// Track chat helpfulness feedback
			await env.PAINTERS_DB.prepare(`
				INSERT INTO website_events (
					date, session_id, event_type, page_url, timestamp,
					event_date, city, country, clicks
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
			`).bind(
				timestamp,
				data.session || 'unknown',
				data.type,
				data.page || '',
				timestamp,
				eventDate,
				city,
				country
			).run();

		} else {
			// Generic event tracking for clicks, scrolls, etc
			await env.PAINTERS_DB.prepare(`
				INSERT INTO website_events (
					date, session_id, event_type, page_url, timestamp,
					event_date, city, country, clicks
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
			`).bind(
				timestamp,
				data.session_id || data.session || 'unknown',
				data.event_type || data.type,
				data.page_url || data.page || '',
				timestamp,
				eventDate,
				city,
				country
			).run();
		}

		// Also write to Analytics Engine for real-time dashboards
		if (env.ANALYTICS_EVENTS) {
			try {
				env.ANALYTICS_EVENTS.writeDataPoint({
					blobs: [
						data.event_type || data.type || 'unknown',
						data.page_url || data.page || '',
						city,
						country
					],
					doubles: [data.value || 0],
					indexes: [data.session_id || data.session || 'unknown']
				});
			} catch (error) {
				logError('Analytics Engine write failed', error);
				// Continue even if analytics fails
			}
		}

		const successResponse = new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
		return applySecurityHeaders(successResponse);

	} catch (error) {
		return handleDatabaseError(error);
	}
}

async function handleChat(
	request: Request,
	env: Env,
	origin: string | null
): Promise<Response> {
	// Validate origin
	if (!isOriginAllowed(origin)) {
		return handleOriginNotAllowed();
	}

	const corsHeaders = getCorsHeaders(origin);

	if (request.method !== 'POST') {
		return createErrorResponse(405, 'Method not allowed', 'Only POST requests are allowed', corsHeaders);
	}

	// Validate request size
	const sizeCheck = validateRequestSize(request);
	if (!sizeCheck.valid) {
		return sizeCheck.error!;
	}

	// Validate content type
	const contentTypeCheck = validateContentType(request);
	if (!contentTypeCheck.valid) {
		return contentTypeCheck.error!;
	}

	try {
		// Parse JSON safely
		const parseResult = await parseJsonSafely(request);
		if (parseResult.error) {
			return parseResult.error;
		}

		const data = parseResult.data as ChatRequest;
		const { message, session, page, stream } = data;

		// Validate payload
		const validation = validateChatPayload(data);
		if (!validation.valid) {
			return handleValidationError(validation.errors!);
		}

		// Check rate limit
		const rateLimit = await checkRateLimit(env.CHAT_HISTORY, session, 'chat', CHAT_LIMIT);
		if (!rateLimit.allowed) {
			return handleRateLimitError(rateLimit.retryAfter!);
		}

		// Special case: frontend requesting metadata after streaming completes
		if (message === '[context]') {
			const contextResponse = new Response(JSON.stringify({
				intents: null,
				session
			}), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
			return applySecurityHeaders(contextResponse);
		}

		// Load conversation history from KV to maintain context
		const historyKey = `chat:${session}`;
		let conversationHistory: ChatMessage[] = [];
		
		try {
			const existingHistory = await env.CHAT_HISTORY.get(historyKey, 'json') as ChatMessage[] | null;
			conversationHistory = existingHistory || [];
		} catch (error) {
			logError('Failed to load chat history', error);
			// Continue with empty history
		}

		conversationHistory.push({
			role: 'user',
			content: message
		});

		// System prompt that teaches the AI about your business
		const systemPrompt = `You are a helpful painting assistant for Dependable Painting, a family-owned painting contractor serving Baldwin and Mobile County, Alabama. You have over a decade of hands-on experience.

Your expertise includes:
- Interior and exterior residential painting
- Cabinet refinishing and painting
- Commercial painting projects
- Sheetrock/drywall repair
- Surface preparation and priming
- Sherwin-Williams and Benjamin Moore products (emphasize Sherwin-Williams Duration, SuperPaint, and Emerald)
- Weather-resistant coatings for Alabama's humid coastal climate
- Color consultation and selection

Your goals:
1. Answer painting questions accurately and helpfully
2. Recommend appropriate paint products for the Gulf Coast climate
3. Explain proper surface preparation and application techniques
4. Help customers understand the value of professional painting
5. Gently encourage them to call or text for a free estimate: (251) 423-5855

Keep responses concise and conversational (2-3 paragraphs max). Be friendly but professional. If someone asks about a specific project, try to understand their needs and suggest they call for a detailed estimate. Never make up pricing information - always say pricing depends on project specifics and they should call for an accurate quote.

Current page: ${page}`;

		// Call AI with timeout protection
		let aiResponse: any;
		try {
			const aiPromise = env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
				messages: [
					{ role: 'system', content: systemPrompt },
					...conversationHistory.map(msg => ({
						role: msg.role,
						content: msg.content
					}))
				],
				stream: stream || false
			});

			// Timeout after 30 seconds
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('AI request timeout')), 30000);
			});

			aiResponse = await Promise.race([aiPromise, timeoutPromise]);
		} catch (error) {
			return handleAIError(error);
		}

		// Handle streaming responses
		if (stream) {
			const encoder = new TextEncoder();

			const streamResponse = new ReadableStream({
				async start(controller) {
					try {
						let fullResponse = '';

						for await (const chunk of aiResponse as any) {
							if (chunk.response) {
								fullResponse += chunk.response;
								controller.enqueue(
									encoder.encode(`data: ${JSON.stringify(chunk.response)}\n\n`)
								);
							}
						}

						// Save conversation to KV after streaming completes
						conversationHistory.push({
							role: 'assistant',
							content: fullResponse
						});

						// Keep only last 10 messages to stay under KV size limits
						const trimmedHistory = conversationHistory.slice(-10);

						// Store for 24 hours
						try {
							await env.CHAT_HISTORY.put(
								historyKey,
								JSON.stringify(trimmedHistory),
								{ expirationTtl: 86400 }
							);
						} catch (error) {
							logError('Failed to save chat history', error);
							// Continue even if save fails
						}

						controller.enqueue(encoder.encode('data: [DONE]\n\n'));
						controller.close();

					} catch (error) {
						logError('Streaming error', error);
						// Send error event to client
						const encoder = new TextEncoder();
						controller.enqueue(encoder.encode('data: {"error": "Stream error"}\n\n'));
						controller.close();
					}
				}
			});

			const streamResponseHeaders = {
				...corsHeaders,
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			};

			const streamResponseObj = new Response(streamResponse, {
				headers: streamResponseHeaders
			});

			return applySecurityHeaders(streamResponseObj);
		}

		// Non-streaming fallback
		const response = aiResponse as any;
		const assistantMessage = response.response || 'I apologize, but I encountered an error. Please call (251) 423-5855 for assistance.';

		conversationHistory.push({
			role: 'assistant',
			content: assistantMessage
		});

		const trimmedHistory = conversationHistory.slice(-10);
		
		try {
			await env.CHAT_HISTORY.put(
				historyKey,
				JSON.stringify(trimmedHistory),
				{ expirationTtl: 86400 }
			);
		} catch (error) {
			logError('Failed to save chat history', error);
			// Continue even if save fails
		}

		const wantsEstimate = false;

		const nonStreamResponse = new Response(JSON.stringify({
			reply: assistantMessage,
			session,
			intents: {
				wantsEstimate
			}
		}), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

		return applySecurityHeaders(nonStreamResponse);

	} catch (error) {
		logError('Chat error', error);
		const errorResponse = new Response(JSON.stringify({
			error: 'Chat failed',
			reply: 'I apologize, but I encountered an error. Please call (251) 423-5855 for immediate assistance.'
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
		return applySecurityHeaders(errorResponse);
	}
}

async function handleChatHistory(
	request: Request,
	env: Env,
	origin: string | null
): Promise<Response> {
	// Validate origin
	if (!isOriginAllowed(origin)) {
		return handleOriginNotAllowed();
	}
	const corsHeaders = getCorsHeaders(origin);

	const url = new URL(request.url);
	const sessionParam = url.searchParams.get('session');
	const limitParam = url.searchParams.get('limit');

	// Validate query params
	const validation = validateChatHistoryParams(sessionParam, limitParam);
	if (!validation.valid) {
		return handleValidationError(validation.errors!);
	}

	// Rate limit by session
	const session = validation.session!;
	const rateLimit = await checkRateLimit(env.CHAT_HISTORY, session, 'history', HISTORY_LIMIT);
	if (!rateLimit.allowed) {
		return handleRateLimitError(rateLimit.retryAfter!);
	}

	try {
		const historyKey = `chat:${session}`;
		const history = await env.CHAT_HISTORY.get(historyKey, 'json') as ChatMessage[] | null;

		if (!history) {
			const notFound = new Response(JSON.stringify({ items: [] }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
			return applySecurityHeaders(notFound);
		}

		// Convert to format frontend expects (question/answer pairs)
		const items: Array<{ question: string; answer: string }> = [];
		for (let i = 0; i < history.length; i += 2) {
			if (history[i] && history[i + 1]) {
				items.push({
					question: history[i].content,
					answer: history[i + 1].content
				});
			}
		}

		const recentItems = items.slice(-(validation.limit ?? 10));

		const okResp = new Response(JSON.stringify({ items: recentItems }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
		return applySecurityHeaders(okResp);

	} catch (error) {
		logError('History error', error);
		const errResp = new Response(JSON.stringify({ items: [] }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
		return applySecurityHeaders(errResp);
	}
}

async function handleEstimate(
	request: Request,
	env: Env,
	origin: string | null
): Promise<Response> {
	// Validate origin
	if (!isOriginAllowed(origin)) {
		return handleOriginNotAllowed();
	}
	const corsHeaders = getCorsHeaders(origin);

	if (request.method !== 'POST') {
		return createErrorResponse(405, 'Method not allowed', 'Only POST requests are allowed', corsHeaders);
	}

	// Validate request size
	const sizeCheck = validateRequestSize(request);
	if (!sizeCheck.valid) {
		return sizeCheck.error!;
	}

	// Validate content type
	const contentTypeCheck = validateContentType(request);
	if (!contentTypeCheck.valid) {
		return contentTypeCheck.error!;
	}

	try {
		// Parse JSON safely
		const parseResult = await parseJsonSafely(request);
		if (parseResult.error) {
			return parseResult.error;
		}
		const data = parseResult.data as any;

		// Validate payload
		const validation = validateEstimatePayload(data);
		if (!validation.valid) {
			return handleValidationError(validation.errors!);
		}

		// Rate limit using session when present
		const sessionId = (typeof data.session === 'string' && data.session) ? data.session : 'unknown';
		const rateLimit = await checkRateLimit(env.CHAT_HISTORY, sessionId, 'estimate', ESTIMATE_LIMIT);
		if (!rateLimit.allowed) {
			return handleRateLimitError(rateLimit.retryAfter!);
		}

		const cf = getRequestCf(request);
		const city = cf?.city ?? 'Unknown';
		const country = cf?.country ?? 'Unknown';

		const timestamp = new Date().toISOString();
		const eventDate = timestamp.split('T')[0];

		// Store estimate request as special event type
		await env.PAINTERS_DB.prepare(`
			INSERT INTO website_events (
				date, session_id, event_type, page_url, timestamp,
				event_date, city, country, name
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			timestamp,
			data.session || 'unknown',
			'estimate_request',
			data.page || '',
			timestamp,
			eventDate,
			city,
			country,
			`${data.name} | ${data.phone} | ${data.email} | ${data.service} | ${data.message}`
		).run();

		const okResp = new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
		return applySecurityHeaders(okResp);

	} catch (error) {
		return handleDatabaseError(error);
	}
}
