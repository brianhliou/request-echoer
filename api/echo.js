export const config = { runtime: 'edge' };

const MAX_BODY_CHARS = 100 * 1024; // 100KB cap for echoed payloads

const ALLOWED_ORIGINS = (() => {
  const raw =
    typeof process !== 'undefined' && process.env && process.env.ALLOW_ORIGINS
      ? process.env.ALLOW_ORIGINS
      : 'https://your-ui.example';
  return new Set(
    raw
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  );
})();

function summarizeText(text) {
  const truncated = text.length > MAX_BODY_CHARS;
  const slice = truncated ? text.slice(0, MAX_BODY_CHARS) : text;
  return {
    preview: truncated ? `${slice}...[truncated]` : slice,
    slice,
    truncated,
  };
}

export default async function handler(req) {
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers.entries());
  const REDACT = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
  ]);
  const REMOVE = new Set([
    'forwarded',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-vercel-proxied-for',
    'x-vercel-oidc-token',
    'x-real-ip',
    'logs-url',
    'x-vercel-deployment-url',
    'x-vercel-id',
    'x-vercel-function-path',
    'x-vercel-ip-as-number',
    'x-vercel-ip-city',
    'x-vercel-ip-continent',
    'x-vercel-ip-country',
    'x-vercel-ip-country-region',
    'x-vercel-ip-latitude',
    'x-vercel-ip-longitude',
    'x-vercel-ip-postal-code',
    'x-vercel-ip-timezone',
    'x-vercel-ja4-digest',
    'sentry-trace',
    'baggage',
  ]);
  for (const k of Object.keys(headers)) {
    const key = k.toLowerCase();
    if (REMOVE.has(key)) delete headers[k];
    else if (REDACT.has(key)) headers[k] = '[redacted]';
  }
  const origin = req.headers.get('origin') || '';
  const corsHeaders = ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {};
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers.get('access-control-request-headers') || '',
      },
    });
  }
  const ct = (headers['content-type'] || '').toLowerCase();
  let body = null;

  try {
    if (ct.includes('application/json')) {
      const { preview, slice, truncated } = summarizeText(await req.text());
      if (!truncated) {
        try {
          body = JSON.parse(slice);
        } catch {
          body = preview;
        }
      } else {
        body = preview;
      }
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const { preview, slice, truncated } = summarizeText(await req.text());
      if (!truncated) {
        const params = new URLSearchParams(slice);
        body = Object.fromEntries(params.entries());
      } else {
        body = preview;
      }
    } else if (ct.startsWith('text/')) {
      const { preview } = summarizeText(await req.text());
      body = preview;
    } else if (ct.includes('multipart/form-data')) {
      const f = await req.formData();
      body = Object.fromEntries(
        [...f.entries()].map(([k,v]) => [k, typeof v === 'string' ? v : (v.name || 'blob')])
      );
    } else if (ct) {
      const buf = await req.arrayBuffer();
      body = { bytes: buf.byteLength };
    }
  } catch (e) {
    body = { parseError: String(e) };
  }

  const res = {
    method: req.method,
    path: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams.entries()),
    headers,
    body,
    ipHint: headers['x-forwarded-for'] || null,
  };

  return new Response(JSON.stringify(res, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}
