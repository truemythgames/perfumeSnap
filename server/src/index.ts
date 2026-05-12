interface Env {
  OPENAI_API_KEY: string;
}

const SYSTEM_PROMPT = `You are PerfumeSnap, an expert AI perfume identifier. When shown an image of a perfume bottle, box, or label, identify the perfume and provide detailed information.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "identified": true/false,
  "name": "Perfume Name",
  "brand": "Brand Name",
  "fragranceFamily": "e.g. Oriental, Floral, Woody, Fresh, Citrus",
  "gender": "e.g. Unisex, Feminine, Masculine",
  "yearLaunched": "e.g. 2015",
  "perfumer": "Name of the nose/perfumer if known",
  "concentration": "e.g. Eau de Parfum, Eau de Toilette, Parfum, Extrait",
  "topNotes": ["note1", "note2", "note3"],
  "heartNotes": ["note1", "note2", "note3"],
  "baseNotes": ["note1", "note2", "note3"],
  "description": "A rich 2-3 sentence description of the fragrance profile and character",
  "priceRange": "e.g. $80-$120 for 50ml",
  "rating": 4.5,
  "longevity": "e.g. Long-lasting (8-10 hours)",
  "sillage": "e.g. Moderate, Strong, Intimate",
  "occasions": ["occasion1", "occasion2"],
  "seasons": ["season1", "season2"],
  "similarPerfumes": ["Similar Perfume 1 by Brand", "Similar Perfume 2 by Brand", "Similar Perfume 3 by Brand"]
}

If you cannot identify the perfume or the image doesn't contain a perfume, set "identified" to false and fill fields with "Unknown".
Be as accurate as possible. Use your knowledge of the perfume industry.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'perfumesnap-api' });
    }

    if (url.pathname === '/identify' && request.method === 'POST') {
      return handleIdentify(request, env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;

async function handleIdentify(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ image: string }>();

    if (!body.image) {
      return jsonResponse({ error: 'Missing "image" field (base64 encoded)' }, 400);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Server misconfigured: missing API key' }, 500);
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this perfume and provide detailed information.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${body.image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text();
      console.error('OpenAI error:', err);
      return jsonResponse({ error: 'AI service error' }, 502);
    }

    const data = await openaiResponse.json<{
      choices: { message: { content: string } }[];
    }>();

    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return jsonResponse({ error: 'Empty AI response' }, 502);
    }

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const perfume = JSON.parse(cleaned);

    return jsonResponse(perfume);
  } catch (err: any) {
    console.error('Identify error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
}
