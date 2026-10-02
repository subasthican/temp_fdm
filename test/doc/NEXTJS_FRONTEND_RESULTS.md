# Next.js frontend conversion — 1 October 2026

The primary StayWise website is now `frontend/`, built with Next.js 16.3.8,
React and TypeScript. The Flask/scikit-learn prediction service remains in
`app.py`. No model retraining was performed during this frontend conversion.

The interface uses warm ivory, navy and muted gold, packaged local typography,
responsive form sections and a cancellation gauge. Three views provide booking
assessment, saved model performance and an assessment guide. All displayed
probabilities and metrics come from the actual backend. There is no fabricated
booking feed or occupancy/revenue data.

## Working features

- All 26 raw booking fields, supplied by backend schema metadata.
- Collapsible sections, required-field completion and reservation summary.
- Server validation with inline errors and reopening/focusing invalid sections.
- Loading states, example booking, reset and stale-result clearing after edits.
- Actual risk probability, retention score, outcome and recommendations.
- JSON assessment download; booking information is not stored on the server.
- Service failure/retry, keyboard help dialog and responsive mobile layouts.
- Same-origin Next.js API forwarding with timeout and preserved backend errors.

## Verification

`npm run build` and `npm run typecheck` passed. All seven Python integration tests
passed. `tests/next_browser_smoke.cjs` passed against the optimized Next.js server
and real Flask backend, covering prediction parity, all fields, download,
optional defaults, collapsed-section errors, reset, stale-result clearing,
navigation, help-dialog keyboard behavior, mobile overflow and service retry.
Proxy checks included invalid JSON/input, wrong methods and unknown endpoints.

Screenshots are in `doc/screenshots/nextjs/`. Earlier application screenshots and
documents refer to the older Flask-rendered frontend, still available as a
fallback on port 5000.

## Run

From the project root after installing Python and frontend dependencies:

```bash
./.venv/bin/python run_site.py
```

Open **http://127.0.0.1:3000**. For the optimized frontend, run
`run_site.py --production` after `npm run build` in `frontend/`.
Ctrl+C stops both services. Windows: `.\.venv\Scripts\python.exe run_site.py`.

For the viva: the frontend is Next.js/React with TypeScript and CSS; the backend
is Python/Flask; scikit-learn runs the saved Random Forest pipeline. The browser
sends JSON to Next.js, which forwards it to Flask and displays its response.
