const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://nicksfabricdemo.openai.azure.com/';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const API_VERSION = '2024-08-01-preview';

const SUPPORTED_SOURCES = [
  'oracle', 'ibm-db2', 'postgresql-self', 'mysql-self',
  'aws-rds-oracle', 'aws-rds-postgresql', 'aws-rds-mysql', 'aws-aurora',
  'gcp-postgresql', 'gcp-mysql', 'gcp-sqlserver',
  'tableau-server', 'tableau-online'
];

const SYSTEM_PROMPT = `You are an architecture diagram analyzer. Given an image of a system architecture diagram, identify all database and data platform components visible in the diagram.

For each database component found, extract:
- type: The closest match from this list: ${SUPPORTED_SOURCES.join(', ')}. Use the most specific match.
- label: The label shown in the diagram (if any)
- count: Number of instances/servers shown (default 1)
- estimatedCoresPerServer: CPU cores if visible or inferable (default 0 means unknown)
- estimatedRamGb: RAM in GB if visible (default 0 means unknown)
- estimatedStorageGb: Storage in GB if visible (default 0 means unknown)
- confidence: Your confidence in this detection (0.0 to 1.0)
- notes: Brief explanation of what you observed

Also report any BI/analytics tools you see (Tableau, Power BI, Looker, etc.) separately.

Respond ONLY with valid JSON in this exact format:
{
  "databases": [...],
  "biTools": [...],
  "warnings": ["any caveats about what could not be determined"]
}

If you cannot identify any databases, return {"databases": [], "biTools": [], "warnings": ["No database components detected in this image"]}.
Do NOT invent values you cannot see or reasonably infer. Use 0 for unknown numeric values.`;

module.exports = async function (context, req) {
  // Validate request
  if (!req.body || !req.body.image) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request must include "image" field with base64-encoded image data' })
    };
    return;
  }

  if (!AZURE_OPENAI_KEY) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Azure OpenAI key not configured. Set AZURE_OPENAI_KEY in application settings.' })
    };
    return;
  }

  const { image, mimeType = 'image/png' } = req.body;

  // Validate image size (max 4MB base64 ≈ 5.3MB string)
  if (image.length > 5_500_000) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Image too large. Maximum size is 4MB.' })
    };
    return;
  }

  // Validate mime type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mimeType)) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Unsupported image type: ${mimeType}. Use PNG, JPEG, WebP, or GIF.` })
    };
    return;
  }

  try {
    const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this architecture diagram and identify all database and BI tool components.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log.error(`Azure OpenAI error: ${response.status} ${errorText}`);
      context.res = {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to analyze image. Please try again.' })
      };
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      context.log.error(`Failed to parse AI response: ${content}`);
      context.res = {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Could not parse AI response. The image may not contain recognizable architecture components.',
          raw: content
        })
      };
      return;
    }

    // Validate and normalize the parsed output
    const result = normalizeResult(parsed);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    context.log.error(`Unexpected error: ${err.message}`);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function normalizeResult(parsed) {
  const databases = (parsed.databases || []).map(db => ({
    type: SUPPORTED_SOURCES.includes(db.type) ? db.type : 'unknown',
    originalType: db.type,
    label: String(db.label || 'Unknown Database'),
    count: Math.max(1, parseInt(db.count) || 1),
    estimatedCoresPerServer: Math.max(0, parseInt(db.estimatedCoresPerServer) || 0),
    estimatedRamGb: Math.max(0, parseInt(db.estimatedRamGb) || 0),
    estimatedStorageGb: Math.max(0, parseInt(db.estimatedStorageGb) || 0),
    confidence: Math.min(1, Math.max(0, parseFloat(db.confidence) || 0.5)),
    notes: String(db.notes || ''),
  }));

  const biTools = (parsed.biTools || []).map(tool => ({
    type: String(tool.type || 'unknown'),
    label: String(tool.label || 'Unknown BI Tool'),
    notes: String(tool.notes || ''),
    confidence: Math.min(1, Math.max(0, parseFloat(tool.confidence) || 0.5)),
  }));

  return {
    databases,
    biTools,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
  };
}
