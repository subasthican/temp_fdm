# StayWise Next.js frontend

Next.js App Router, React and TypeScript. Fonts are packaged locally; no external
font service is required. The UI uses actual model metadata and predictions from
the Flask backend. Three workspace views cover assessment, performance and usage.

## Setup

Install Node.js (22 or newer recommended), then from this directory:

```bash
npm install
npm run build
```

From the project root, with Python dependencies installed:

```bash
./.venv/bin/python run_site.py
```

This starts Flask on port 5000 and Next.js on port 3000. Open
http://127.0.0.1:3000. Ctrl+C stops both. On Windows use
`.\.venv\Scripts\python.exe run_site.py` or `run.ps1`.

For the optimized build, use `run_site.py --production` after `npm run build`.
For independent services, start `app.py` in one terminal and `npm run dev` here in
another terminal. The older Flask-rendered page remains at port 5000 as a fallback.

## API connection

`app/api/[endpoint]/route.ts` forwards health/model/predict requests to Flask,
preserving validation errors and status codes. Set `FLASK_API_URL` in `.env.local`
to change the backend address (see `.env.example`). The browser uses same-origin
Next.js API routes, so local use requires no browser CORS configuration.

The form schema comes from `/api/model`; restart Flask after changing `app.py`.
Editing inputs invalidates the displayed prediction. No reservation database or
invented booking activity is shown. Model metrics are the saved historical test
metrics; the interface does not claim current-hotel or financial performance.

## Verification

```bash
npm run build
npm run typecheck
```

With both services running, the root `tests/next_browser_smoke.cjs` checks the UI
using Playwright. Install Playwright under your OS temporary directory in
`fdm-browser-tools`, then install its Chromium browser before running that check.

Architecture reference: [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).
