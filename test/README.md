# StayWise — hotel booking cancellation application

## Next.js website (current frontend)

The primary frontend is now in `frontend/`: Next.js, React and TypeScript with a
redesigned booking workspace. Flask remains the Python prediction service.

After the Python setup below, install Node.js and run:

```bash
cd frontend
npm install
npm run build
cd ..
./.venv/bin/python run_site.py
```

On Windows, the last command is `.\.venv\Scripts\python.exe run_site.py`.
Open **http://127.0.0.1:3000** for the new website. Ctrl+C stops both services.
Use `run_site.py --production` to serve the optimized build. The instructions
below for `app.py` alone start the API and older Flask-rendered fallback page at
port 5000. See [frontend setup](frontend/README.md) for details.

## Python backend and legacy-page setup

A Flask backend and responsive browser frontend implementing Stages 9 and 10. The application loads the existing **Model/best_hotel_cancellation_model.joblib**; it does not retrain the model. No custom `.pyc` helper is required.

The model was rebuilt and the application verified on macOS on 1 October 2026.
See [current rebuild results](doc/MODEL_REBUILD_RESULTS.md) for the replacement
artifact's metrics and verification; older report results describe an earlier run.

## Setup requirements

Install **Python 3.13** from [python.org](https://www.python.org/downloads/). On Windows, enable **Add Python to PATH** during installation. VS Code is optional; its integrated terminal can run all the commands below.

Download and extract this project, or clone its repository. Keep these files together: `app.py`, `requirements.txt`, `templates/`, `static/`, and **`Model/best_hotel_cancellation_model.joblib`**. Keep `hotel_bookings.csv` as well if you want to run the historical-data tests.

Create a separate virtual environment on each computer. Do not copy a Windows `.venv` to macOS or reuse an environment from another machine. The pinned dependencies match the existing model environment; use Python 3.13 and `requirements.txt` to preserve compatibility.

## Windows setup (PowerShell)

1. Open PowerShell or **Terminal > New Terminal** in VS Code.
2. Enter your project folder. Replace the example path if your project is elsewhere:

```powershell
cd "C:\Users\ADMIN\Desktop\FDM"
```

3. Check Python, create the environment, and install dependencies. Complete installation before starting the application:

```powershell
py -3.13 --version
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If `py` is unavailable but `python --version` reports Python 3.13, use `python -m venv .venv` instead. On the existing project computer, you can skip environment creation and installation if the working `.venv` is already present.

4. Start the application:

```powershell
.\.venv\Scripts\python.exe app.py
```

5. Open Microsoft Edge, Chrome, or another browser and enter **http://127.0.0.1:5000**.

These commands use the environment's Python directly, so PowerShell activation is unnecessary. `run.ps1` is an optional Windows shortcut once dependencies are installed.

## macOS setup (Terminal)

1. Install Python 3.13, then open **Terminal** or the VS Code integrated terminal.
2. Enter your project folder. Replace the example path with your own:

```bash
cd "$HOME/Desktop/FDM"
```

3. Check Python, create the environment, and install dependencies:

```bash
python3.13 --version
python3.13 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements.txt
```

4. Start the application:

```bash
./.venv/bin/python app.py
```

5. Open Safari, Microsoft Edge, Chrome, or another browser and enter **http://127.0.0.1:5000**.

The Windows `run.ps1` shortcut is not used on macOS.

## Rebuilding a missing or damaged model

The supplied notebook can regenerate the deployment model using the full dataset,
original split, cross-validation, tuning and held-out evaluation. From the project
folder on macOS, run:

```bash
./.venv/bin/python -m pip install -r requirements-training.txt
./.venv/bin/python -u rebuild_model.py
./.venv/bin/python -m unittest discover -s tests -v
```

The rebuild can take several minutes. It leaves the notebook and its recorded
outputs unchanged, verifies the newly saved pipeline, backs up the previous
artifact to an OS temporary directory, and then replaces
`Model/best_hotel_cancellation_model.joblib`. The printed metrics describe the
new run; compare them with historical report values before presenting results.

## Daily use and stopping the application

After the first setup, enter the project folder and run only the start command for your operating system. Keep the terminal open while using the website. Press **Ctrl+C** in that terminal to stop the server. Run the start command again to restart it.

Try **Load example booking**, then **Assess cancellation risk** to confirm the application works. A readiness check is also available at **http://127.0.0.1:5000/api/health**.

## Setup troubleshooting

- **Python command not found:** Install Python 3.13 and reopen your terminal. On Windows, check that Python was added to PATH.
- **ModuleNotFoundError:** Run the dependency installation command for your operating system using the `.venv` Python, then start the app using that same Python.
- **Model file not found:** Confirm `Model/best_hotel_cancellation_model.joblib` exists, with the exact capitalization. The compiled helper `.pyc` file is not a substitute for the model.
- **Port 5000 already in use:** An instance may already be running; try opening the website. Otherwise stop the previous instance with Ctrl+C before restarting.
- **Browser cannot connect:** Check that the terminal shows `Running on http://127.0.0.1:5000` and has no startup error. Open the address on the same computer where the server is running.

The built-in server is for local development/demonstration. These instructions do not deploy the app to Vercel or expose it publicly; external hosting needs separate deployment configuration.

## Using the application

1. Enter booking details, or click **Load example booking** for demonstration.
2. Specify the planned arrival date, guest counts, nights, room codes, reservation arrangements and known history.
3. Click **Assess cancellation risk**. Review probability, likely outcome and recommended follow-up.
4. Download the assessment as JSON if needed. Editing the form clears the old result so it cannot be mistaken for an updated prediction.

The example is illustrative, not a verified actual booking. Inputs are not stored on the server. The browser uses the same origin for frontend and API. Country options use historical dataset codes. Zero agent/company means no recorded identifier. Users must use IDs consistent with the original data; arbitrary local IDs may have different meanings.

## API

`GET /api/health`: readiness and selected model.

`GET /api/model`: metrics, threshold, category choices and example booking payload.

`POST /api/predict`: JSON booking object using the example keys from `/api/model`. Returns cancellation probability, retention probability, binary outcome, risk band, recommendation and explanatory note. Missing required fields return HTTP 400 with field-specific errors; missing children/country/agent/company use training cleaning defaults. Bad JSON/object shape returns 400, unsupported content type 415, oversized payload 413, model failure 503.

The interface accepts 26 raw fields. Arrival date becomes four training columns; four engineered features bring the model input to 33 columns. It derives total nights, long stay (>7), weekend stay (>0), and high lead time (>60). The saved fitted pipeline handles identifier normalization, numeric imputation/scaling and categorical encoding. No preprocessing is fitted during inference.

Decision threshold: 0.5 from the artifact. Operational risk bands: Low <0.25; Moderate 0.25–<0.5; High ≥0.5. Bands are application conventions, not validated business-optimal cutoffs. Scores have not been calibrated. Performance cards use saved held-out metrics, not live accuracy.

## Verification

Windows:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

macOS:

```bash
./.venv/bin/python -m unittest discover -s tests -v
```

Tests cover the page, API contract, malformed/missing/invalid input, optional defaults, cross-field checks, exact engineering boundaries, inference failures and prediction parity against 20 real historical rows prepared independently using notebook rules.

## Files and deliverables

- `app.py`: service, validation and preprocessing.
- `templates/index.html`, `static/`: browser application.
- `tests/test_app.py`: integration and parity checks.
- `doc/STAGE_9_12_REPORT.md`: report continuation and complete project summary.
- `doc/DEMONSTRATION.md`: presentation outline and demonstration script.
- `doc/StayWise_Technical_Report.docx`, `doc/StayWise_Presentation.pptx`: editable report and slides generated from project evidence.

## Interpretation and limits

The model was trained on 2015–2017 data from two historical hotels. It is decision support for reservation staff, not a guarantee of cancellation or a demonstrated revenue improvement. Assigned room type and booking changes must be available at assessment time. New hotels, current prices, dates and agent identifiers may differ from training. Arrival week is derived using ISO calendar weeks; this convention should be checked when integrating an external reservation system. Validation bounds are service safeguards, not empirical training ranges. Zero-night and zero-guest entries are rejected for operational bookings even though such rows exist in the historical data.
