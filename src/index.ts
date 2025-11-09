interface Env {
	PAINTERS_DB: D1Database;
	CHAT_HISTORY: KVNamespace;
	AI: Ai;
	ANALYTICS_EVENTS: AnalyticsEngineDataset;
	ASSETS: Fetcher;
}

interface TrackingEvent {
	type: string;
	session_id?: string;
	page_url?: string;
	event_type?: string;
	metric?: string;
	value?: number;
	rating?: string;
	session?: string;
	page?: string;
}

interface ChatMessage {
	role: 'user' | 'assistant';
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

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Route API endpoints
			if (url.pathname === '/api/track') {
				return await handleTracking(request, env, corsHeaders);
			}

			if (url.pathname === '/api/chat') {
				return await handleChat(request, env, corsHeaders);
			}

			if (url.pathname === '/api/chat/history') {
				return await handleChatHistory(request, env, corsHeaders);
			}

			if (url.pathname === '/api/estimate') {
				return await handleEstimate(request, env, corsHeaders);
			}

			// Serve static assets from public folder
			return await env.ASSETS.fetch(request);

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	}
};

async function handleTracking(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	try {
		const data = await request.json() as TrackingEvent;

		// Cloudflare automatically adds geolocation data to every request
		const city = request.cf?.city as string || 'Unknown';
		const country = request.cf?.country as string || 'Unknown';

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
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Tracking error:', error);
		return new Response(JSON.stringify({ error: 'Failed to track event' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

async function handleChat(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	try {
		const { message, session, page, stream } = await request.json() as ChatRequest;

		// Special case: frontend requesting metadata after streaming completes
		if (message === '[context]') {
			return new Response(JSON.stringify({
				intents: null,
				session
			}), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Load conversation history from KV to maintain context
		const historyKey = `chat:${session}`;
		const existingHistory = await env.CHAT_HISTORY.get(historyKey, 'json') as ChatMessage[] | null;
		const conversationHistory = existingHistory || [];

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

		const aiResponse = await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
			messages: [
				{ role: 'system', content: systemPrompt },
				...conversationHistory.map(msg => ({
					role: msg.role,
					content: msg.content
				}))
			],
			stream: stream || false
		});

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
						await env.CHAT_HISTORY.put(
							historyKey,
							JSON.stringify(trimmedHistory),
							{ expirationTtl: 86400 }
						);

						controller.enqueue(encoder.encode('data: [DONE]\n\n'));
						controller.close();

					} catch (error) {
						console.error('Streaming error:', error);
						controller.error(error);
					}
				}
			});

			return new Response(streamResponse, {
				headers: {
					...corsHeaders,
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				}
			});
		}

		// Non-streaming fallback
		const response = aiResponse as any;
		const assistantMessage = response.response || 'I apologize, but I encountered an error. Please call (251) 423-5855 for assistance.';

		conversationHistory.push({
			role: 'assistant',
			content: assistantMessage
		});

		const trimmedHistory = conversationHistory.slice(-10);
		await env.CHAT_HISTORY.put(
			historyKey,
			JSON.stringify(trimmedHistory),
			{ expirationTtl: 86400 }
		);

		// Simple keyword detection for showing estimate form
		const wantsEstimate = /estimate|quote|pricing|cost|price|how much/i.test(message) ||
			/schedule|book|appointment|visit/i.test(message);

		return new Response(JSON.stringify({
			reply: assistantMessage,
			session,
			intents: {
				wantsEstimate
			}
		}), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Chat error:', error);
		return new Response(JSON.stringify({
			error: 'Chat failed',
			reply: 'I apologize, but I encountered an error. Please call (251) 423-5855 for immediate assistance.'
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

async function handleChatHistory(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const url = new URL(request.url);
	const session = url.searchParams.get('session');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	if (!session) {
		return new Response(JSON.stringify({ items: [] }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		const historyKey = `chat:${session}`;
		const history = await env.CHAT_HISTORY.get(historyKey, 'json') as ChatMessage[] | null;

		if (!history) {
			return new Response(JSON.stringify({ items: [] }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Convert to format frontend expects (question/answer pairs)
		const items = [];
		for (let i = 0; i < history.length; i += 2) {
			if (history[i] && history[i + 1]) {
				items.push({
					question: history[i].content,
					answer: history[i + 1].content
				});
			}
		}

		const recentItems = items.slice(-limit);

		return new Response(JSON.stringify({ items: recentItems }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('History error:', error);
		return new Response(JSON.stringify({ items: [] }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

async function handleEstimate(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	try {
		const data = await request.json() as any;

		const timestamp = new Date().toISOString();
		const eventDate = timestamp.split('T')[0];
		const city = request.cf?.city as string || 'Unknown';
		const country = request.cf?.country as string || 'Unknown';

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

		return new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Estimate error:', error);
		return new Response(JSON.stringify({ error: 'Failed to submit estimate' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}