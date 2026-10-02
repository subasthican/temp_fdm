# StayWise system test evidence

Executed locally on 1 October 2026 using the project's Python 3.13 environment and supplied model.

## Automated service checks

Command: `.\.venv\Scripts\python.exe -m unittest discover -s tests -v`

Result: **7 tests passed**.

| Check | Evidence |
| --- | --- |
| Page, health and model information | HTTP 200; ready status and expected model |
| Prediction response | Probability in [0,1]; complementary retention score; class agrees with saved 0.5 threshold |
| Invalid/missing input | Required fields, negative counts, fractional counts, NaN/infinity, booleans, unknown categories and invalid dates rejected |
| Protocol errors | Malformed JSON and arrays: 400; non-JSON: 415; oversized body: 413 |
| Optional inputs and booking consistency | Training-compatible defaults; zero-guest/zero-night bookings rejected |
| Engineering boundaries | 60 vs 61 lead-time days; 7 vs 8 nights checked |
| Historical prediction parity | 20 independently prepared historical rows agree with direct saved-model probabilities within 1e-12 |
| Controlled inference failure | 503 with a clear message; internal details excluded from response |

Live HTTP checks also return 200 for `/`, `/api/health` and `/api/model`. JavaScript syntax passes `node --check static/app.js`. Generated report opens with python-docx; generated presentation opens with python-pptx and contains 12 slides with speaker notes.

These are software correctness checks. They do not establish current real-world predictive accuracy or business value. The saved held-out model results are reported separately in the technical report.

## Browser checks

Headless Chromium checks **passed** at desktop (1440 × 1000) and mobile (390 × 844) widths:

- Example booking submitted through the browser returns 24.97% estimated cancellation probability and likely kept outcome.
- Downloaded JSON contains the corresponding booking and assessment.
- Editing a field clears the prior assessment.
- A zero-guest booking shows a backend field error.
- Mobile inference succeeds and the document has no horizontal overflow.
- Reset clears the displayed prediction.
- No JavaScript runtime errors occur.

Command: `node tests/browser_smoke.cjs` (optional Playwright dependency installed under the system temporary directory; setup is described at the top of the script).

Screenshots: `doc/screenshots/desktop-form.png`, `desktop-result.png`, and `mobile-result.png`. These are generated from the real application, not design mockups. External reservation integrations, production hosting and current-hotel validation have not been tested.
