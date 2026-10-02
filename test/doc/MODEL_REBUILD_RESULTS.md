# Model restoration and macOS verification — 1 October 2026

The damaged deployment artifact has been replaced by a full-data rebuild using
the original code cells in `Model/new.ipynb`, executed by `rebuild_model.py`.
The notebook and its historical saved outputs were not modified. Earlier report
statements that the artifact cannot load describe the state before this repair.

## Rebuilt model results

Selected model: Tuned Random Forest. Parameters: 100 trees, maximum depth 20,
minimum leaf size 2, maximum feature fraction 0.7. Training CV ROC-AUC:
0.9125226001. The original stratified split is retained: 69,916 training rows and
17,480 test rows. The full baseline comparison, both tuning searches and feature
ablation were executed; this is not a reduced-data smoke-training run.

| Held-out metric | New result |
| --- | ---: |
| Accuracy | 85.03% |
| Balanced accuracy | 79.78% |
| Cancellation precision | 75.09% |
| Cancellation recall | 68.14% |
| F1 | 71.45% |
| ROC-AUC | 0.9162 |
| Average precision | 0.8132 |
| Specificity | 91.43% |
| MCC | 0.6147 |

These are newly computed results under the pinned application environment.
Earlier notebook/report values (85.08% accuracy and 0.9158 AUC) remain historical
results. Use this table when discussing the rebuilt artifact; do not silently
present historical values as measurements of the replacement artifact.

The current example booking returns 27.80% cancellation risk, Moderate band,
and likely to keep booking. The example is illustrative; scores are uncalibrated.

## Verification

- All seven service integration tests passed, including historical-row inference
  parity, validation, feature boundaries and controlled inference failures.
- Dependency consistency check passed (`python -m pip check`).
- Application and browser-test JavaScript syntax checks passed.
- Live health and model endpoints returned HTTP 200; example prediction succeeded.
- Desktop (1440 x 1000) and mobile (390 x 844) Chromium checks passed: prediction,
  JSON download, invalid-guest errors, clearing stale results, reset, no horizontal
  mobile overflow and no JavaScript runtime errors. Screenshots in `doc/screenshots`
  were refreshed from this run. Repeated ensemble probabilities are compared with
  a 1e-12 tolerance to allow floating-point summation differences.
- The rebuilt pipeline was saved, reloaded and checked for identical sample labels
  and probabilities before replacing the original artifact.

The previous damaged artifact was retained outside the repository at:
`/var/folders/2p/dpm029r1409fmm34br8vz0yr0000gn/T/staywise-original-model-6y9oh_w2/`.
This temporary backup may be cleared by the operating system.

## Starting on this Mac

From the project directory:

```bash
./.venv/bin/python app.py
```

Open http://127.0.0.1:5000. Stop the server with Ctrl+C in its terminal.
The virtual environment has application and notebook training dependencies installed.
