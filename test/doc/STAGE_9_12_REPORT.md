# StayWise: Hotel Booking Cancellation Prediction

Technical report draft — 1 October 2026. Prepared from the existing notebook, dataset, saved artifact and implemented application. Group members must review the report, confirm their actual contributions and attach institutional submission details before submission. Deadline supplied in the assignment: 6 October; KandyUni and Northern Uni dates are communicated by staff.

## 1. Introduction and problem definition

Hotel cancellations create uncertainty in occupancy, staffing and room allocation. This project estimates whether a reservation will be canceled using historical booking characteristics. The binary target is `is_canceled`: 0 means not canceled and 1 means canceled. StayWise translates this estimate into a clear result and suggested follow-up for hotel staff. No financial saving or operational improvement has been measured in a real hotel deployment.

## 2. Scenario and stakeholder requirements

Reservation staff need to assess a booking quickly, understand missing-input errors and receive a meaningful outcome. Managers and revenue teams need risk information for follow-up and contingency planning. The system must use information available before the final cancellation outcome. The application provides labeled categorical and numeric fields, server-side validation, estimated cancellation probability, likely outcome and a suggested next action. Assigned-room type and booking changes are retained by the trained model, so this is an assessment at a point when those details are available, not necessarily at initial booking creation.

## 3. Dataset identification, citation and validation

The Hotel Booking Demand dataset was obtained through Jesse Mostipak's Kaggle distribution. The research source is Antonio, N., de Almeida, A., and Nunes, L. (2019), Hotel booking demand datasets, Data in Brief, 22, 41–49, DOI 10.1016/j.dib.2018.11.126. Source attribution is taken from the existing project proposal.

The local CSV contains 119,390 rows and 32 columns, covering City Hotel and Resort Hotel bookings with arrivals from July 2015 to August 2017. The original labels are 75,166 not canceled and 44,224 canceled. Validation includes shape/type inspection, missing-value counts, duplicate inspection, target checks, categorical cardinality review and leakage review. Instructor approval is stated in the existing report; an independent signed approval record is not present in this workspace.

## 4. Data understanding and EDA

The notebook inspects hotel, month, customer type, market segment, country, room codes, lead time, average daily rate and stay length. EDA identifies class imbalance, missing identifiers, high categorical cardinality, duplicate rows and differences in observed cancellation rates between categories. These are descriptive associations and do not demonstrate causes of cancellation. The original cancellation prevalence is 37.04%, while removing duplicates changes it to approximately 27.49%; the cleaned prevalence is the relevant baseline for model evaluation.

## 5. Cleaning and preprocessing

The notebook removes 31,994 exact duplicates, leaving 87,396 rows. Missing children values are filled using the median (zero in this dataset); country uses Unknown; agent/company use zero and integer normalization. Other categorical defaults include SC for meal and Transient for customer type where applicable. Reservation status and reservation-status date are removed because they expose the final outcome.

The stratified 80/20 split with random seed 42 produces 69,916 training rows and 17,480 test rows. Preprocessing inside each fitted pipeline includes numeric imputation and standardization and categorical imputation and one-hot encoding, with unknown-category handling and minimum category frequency 50. Agent/company are treated as categorical identifiers. Cross-validation fits preprocessing within its training folds. Some preliminary cleaning is performed before splitting, so future work should move all learned cleaning into training-only pipeline steps.

## 6. Feature engineering and selection

The model uses 33 features: 21 numeric and 12 categorical. Engineered features are total nights = week nights + weekend nights; long stay = total nights >7; weekend stay = weekend nights >0; high lead time = lead time >60. Feature exclusion removes the outcome fields and the target from predictors. Ablation gives training CV ROC-AUC 0.9125 with engineering and 0.9126 without it. This difference of approximately -0.0001 provides no evidence of improvement from engineered features. They remain in the supplied artifact and are reproduced exactly in the application.

## 7. Algorithms and rationale

Logistic Regression provides a linear baseline; Decision Tree captures simple nonlinear decision rules; Random Forest combines trees to capture interactions with improved stability; Extra Trees introduces further randomization as an ensemble comparison. All candidates are compared using the same training-only three-fold stratified cross-validation. ROC-AUC is the selection criterion because it measures discrimination across thresholds. Accuracy alone is insufficient: always predicting no cancellation gives approximately 72.51% on the cleaned/test population.

## 8. Model comparison and evaluation

Training CV ROC-AUC results saved in the notebook:

| Candidate | CV ROC-AUC |
| --- | --- |
| Tuned Random Forest | 0.9125 |
| Baseline Random Forest | 0.9097 |
| Baseline Extra Trees | 0.9058 |
| Tuned Logistic Regression | 0.8644 |
| Baseline Logistic Regression | 0.8640 |
| Baseline Decision Tree | 0.8476 |

The selected model's saved held-out results are accuracy 85.08%, balanced accuracy 79.72%, precision 75.43%, recall 67.80%, F1 71.42%, ROC-AUC 0.9158, average precision 0.8123, specificity 91.63% and MCC 0.6152.

| Actual outcome | Predicted kept | Predicted canceled |
| --- | --- | --- |
| Not canceled | 11,614 | 1,061 |
| Canceled | 1,547 | 3,258 |

The model identifies 3,258 of 4,805 actual cancellations and misses 1,547. Of the flagged bookings, 1,061 actually remain. Staff should therefore use predictions to prioritize contact and planning, rather than treat them as certainty. The notebook includes confusion-matrix, ROC and precision-recall plots.

## 9. Hyperparameter tuning and optimization

Random Forest uses a four-candidate randomized search across tree count, depth, leaf size and feature fraction. The selected parameters are 100 trees, depth 20, minimum leaf size 2 and maximum feature fraction 0.7. Logistic Regression uses grid search across C values 0.3, 1 and 3 and class weights None or balanced; its best result uses C=3 and balanced weights. Both searches use the same cross-validation ROC-AUC criterion. The limited search budget is an optimization limitation.

## 10. Final model selection

Tuned Random Forest is selected by the highest training CV ROC-AUC, then refitted on all training rows. The held-out test set evaluates the selected model rather than determining selection. The artifact contains the fitted deployment pipeline, ordered feature names, selected name, classification threshold 0.5, CV score and test metrics. Saved probabilities and outcomes were verified on reload. Stage 9 loads this existing artifact and never fits a transformer or classifier on incoming user input.

## 11. System architecture and implementation

The browser requests the Flask-rendered form and static CSS/JavaScript. JavaScript submits booking JSON to POST /api/predict on the same origin. The service checks field values, constructs the ordered feature frame, calls the saved pipeline and returns structured JSON. The browser displays the result without a page reload. GET /api/health reports readiness; GET /api/model exposes model information and an example payload. Inputs are processed in memory and are not stored in a database. Optional JSON downloads are created in the user's browser.

Architecture: Browser form → Flask input validation → calendar/feature derivation → saved normalization and preprocessing → Random Forest → JSON outcome and risk → browser assessment.

## 12. Backend and frontend development

The backend uses Flask and loads Model/best_hotel_cancellation_model.joblib relative to app.py, allowing launch from any working directory. It validates required fields, numeric finiteness, integer counts, nonnegative operational values, dates and known categorical options. Optional children, country, agent and company use training-compatible defaults. It rejects zero guests and zero nights for the operational form; this narrows the accepted domain compared with the historical dataset. Validation upper bounds are application safeguards, not statistical training ranges.

Arrival date produces year, month name, ISO week and day of month. The four derived features use the notebook's exact rules. Agent/company stay integral before the artifact converts them to strings. The fitted pipeline applies imputation, scaling and encoding. Results include both class probabilities, outcome, risk band, threshold, recommended action and limitations. HTTP errors are 400 for invalid input, 415 for wrong content type, 413 for oversized inputs and 503 for inference failure; internal exception details are logged rather than sent to users.

The frontend groups 26 user fields into booking/arrival, guests/preferences, arrangements, and history. It includes a demonstration example, reset, loading indicator, accessible labels, field-specific errors, mobile layout and downloadable JSON assessment. It disables editing while inference runs and clears previous predictions on edits. Performance cards show saved test metrics. Low (<25%), Moderate (25–<50%) and High (≥50%) bands are operational display conventions; they have not been optimized for business cost or calibrated. The UI links scores to proportionate follow-up suggestions without claiming individual causal explanations.

## 13. System testing and results

Seven automated integration tests pass using Python unittest and Flask's test client. Coverage includes page/readiness, prediction output consistency, required/malformed inputs, negative/fractional/nonfinite values, invalid dates/categories, optional defaults, zero-guest/zero-night checks, exact 60/61-day and 7/8-night feature boundaries, request-size limits, and controlled model failures. Independently prepared notebook-equivalent inputs for 20 real historical rows give identical probabilities within 1e-12 tolerance. These tests verify implementation parity, not new predictive accuracy. The original model metrics remain the evaluation evidence. Browser smoke-test evidence and screenshots are documented separately in SYSTEM_TEST_RESULTS.md when completed.

## 14. Limitations and future improvements

The data are historical and represent two hotels; present-day local hotels can differ. Random splitting does not establish performance on a later time period. Room assignments and booking updates need a clearly defined prediction point. Country, agent and company categories may have location-specific meaning. Arrival-week conventions should be verified with any external reservation system. The application restricts unknown categorical inputs while the model encoder can technically handle unseen categories. Model probabilities are not calibrated and the threshold is not cost-optimized. Group-specific fairness and live business impact have not been assessed.

Future improvements include temporal/external validation, current hotel data, calibration, cost-based thresholds, subgroup analysis, booking-system integration, drift monitoring and a production WSGI deployment with appropriate access controls. These are proposed extensions, not completed features.

## 15. Individual and group contributions

The existing team guide names Manoharan Subasthican (IT23810778), Kuganesan Kageepan (IT23717572), Gowsika Surendran (IT23794566) and Kokulan Seyon (IT23752672). Its allocations are study responsibilities rather than evidence of original code authorship. Each member must confirm actual completed work and evidence before submission. Backend/frontend/report artifacts added in this session were developed with coding-assistant support; members should understand, validate and accurately disclose that support according to course requirements. Do not claim the proposed allocations as verified individual contributions.

## 16. Business recommendation

Use StayWise as a reservation review aid: prioritize courteous confirmation for flagged bookings and include uncertainty in occupancy planning. Begin with a monitored pilot and measure whether follow-up is useful. The held-out results support risk discrimination on the historical dataset, while the false positives and missed cancellations require human judgement. A pilot should establish local performance before business policies depend on predictions.

## References and evidence

- Mostipak, J., Hotel Booking Demand, Kaggle: https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand (source recorded in project proposal).
- Antonio, N., de Almeida, A., and Nunes, L. (2019), Hotel booking demand datasets, Data in Brief 22, 41–49. https://doi.org/10.1016/j.dib.2018.11.126 (citation recorded in project proposal).
- Model/new.ipynb: data preparation, comparison, tuning, evaluation and artifact export.
- Model/best_hotel_cancellation_model.joblib: selected model and full-precision saved metrics.
- doc/FDM.pdf and existing technical report: scenario and source documentation.
- app.py, templates/index.html, static/app.js, tests/test_app.py: implementation and tests.

This report supplements the existing draft without overwriting it. Review formatting, institutional details, contributions and evidence before final submission.
