// Cloudflare Worker API proxy for Status Mail Builder
// Keep your OpenAI API key here as an environment secret named OPENAI_API_KEY.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function safeText(value, maxLength = 2500) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildPrompt(point) {
  return JSON.stringify({
    task: 'Improve the sentence quality for a status update email.',
    rules: [
      'Use simple, professional English.',
      'Do not add fake dates, names, owners, approvals, or technical details.',
      'Keep the same meaning and status.',
      'Fix grammar and make the text suitable for client/team email.',
      'Keep it short. Do not make it too long.',
      'Return only valid JSON with keys: title, action, details.'
    ],
    input: {
      status: safeText(point.status, 50),
      title: safeText(point.title, 300),
      action: safeText(point.action, 800),
      details: safeText(point.details, 2500)
    },
    outputExample: {
      title: 'Actual AKS Cluster Overview',
      action: 'The AKS cluster overview and configuration details are required before proceeding with the upgrade activity.',
      details: 'The cluster configuration is a critical prerequisite because the client has requested a Kubernetes version upgrade.'
    }
  });
}

function extractOutputText(openAiJson) {
  if (typeof openAiJson.output_text === 'string') {
    return openAiJson.output_text;
  }

  const chunks = [];
  for (const item of openAiJson.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
      if (content.type === 'text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseEnhanced(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('OpenAI did not return JSON.');
  }

  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  return {
    title: safeText(parsed.title, 300),
    action: safeText(parsed.action, 1000),
    details: safeText(parsed.details, 3000)
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Only POST is allowed.' }, 405);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'OPENAI_API_KEY secret is missing in Worker environment.' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
    }

    const point = body.point || {};
    const model = safeText(body.model, 80) || 'gpt-5.4-nano';

    if (!point.title && !point.action && !point.details) {
      return jsonResponse({ error: 'Point title, action, or details are required.' }, 400);
    }

    const payload = {
      model,
      input: [
        {
          role: 'system',
          content: 'You are a business email writing assistant. Rewrite status update text clearly and professionally. Return only JSON.'
        },
        {
          role: 'user',
          content: buildPrompt(point)
        }
      ],
      reasoning: {
        effort: 'minimal'
      },
      max_output_tokens: 700
    };

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const openAiJson = await openAiResponse.json().catch(() => ({}));

    if (!openAiResponse.ok) {
      const message = openAiJson.error?.message || `OpenAI API failed with HTTP ${openAiResponse.status}`;
      return jsonResponse({ error: message }, openAiResponse.status);
    }

    try {
      const outputText = extractOutputText(openAiJson);
      const enhanced = parseEnhanced(outputText);
      return jsonResponse({ enhanced });
    } catch (error) {
      return jsonResponse({
        error: error.message || 'Failed to parse OpenAI response.',
        raw: extractOutputText(openAiJson)
      }, 502);
    }
  }
};
