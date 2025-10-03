# Request Echoer

Request Echoer is a lightweight debugging helper for inspecting HTTP requests against a Vercel Edge function. The single-page UI sends requests to `/api/echo`, and the handler returns a sanitized JSON snapshot of what the server received, making it easy to confirm methods, query strings, headers, and payloads.

## Features
- Collect HTTP method, query string, headers, and body from the browser UI.
- Edge runtime handler echoes request metadata while applying production-friendly safety measures:
  - Sensitive headers are redacted or removed (authorization, cookies, IP hints, Vercel metadata, tracing IDs).
  - Bodies are truncated to 100 KB and parsed cautiously (JSON, form-encoded, text, multipart, or binary length).
  - IP-related headers are stripped before the response is returned.
  - Strict CORS policy keeps responses same-origin unless an allowlisted domain is provided.
- Default Content Security Policy, referrer, and MIME-sniffing protections are applied globally via `vercel.json`.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (matches Vercel Edge runtime requirements)
- [Vercel CLI](https://vercel.com/docs/cli) (installed automatically when running `npx vercel dev`)

### Installation
Clone the repository and install dependencies (none required for this minimal app):

```bash
git clone https://github.com/yourname/request-echoer.git
cd request-echoer
```

### Environment Variables
`ALLOWED_ORIGINS` controls which cross-origin requests may receive responses. Provide a comma-separated list of origins (scheme + host + optional port). Example:

```bash
# .env.local
ALLOW_ORIGINS=https://request-echoer.vercel.app,https://staging.example.com
```

If the variable is unset, a placeholder (`https://your-ui.example`) keeps CORS restrictive until you configure real domains.

### Development
Start the local dev server:

```bash
npx vercel dev
```

The app will run at `http://localhost:3000`. Open it in a browser, craft a request, and click **Send to /api/echo** to see the echoed response.

### Production Deployment
1. Create a Vercel project and link this directory (`vercel link`).
2. Set `ALLOW_ORIGINS` in the Vercel dashboard → **Settings → Environment Variables** for the environments you use (Production/Preview/Development).
3. Deploy with `vercel --prod` or through your preferred workflow.

## Project Structure

```
.
├── api/
│   └── echo.js       # Edge function handling request sanitization and echo
├── index.html        # Minimal UI for composing requests
├── main.js           # Client-side logic for submitting requests and rendering output
├── vercel.json       # Security headers (CSP, Referrer-Policy, X-Content-Type-Options)
└── README.md         # Project documentation
```

## Security Notes
- Do not relax the CORS allowlist unless required; never return `*`.
- Update the Content Security Policy if you introduce external scripts or assets.
- Review and extend the header redaction/remove sets if new headers appear in your environment.

## License
MIT
