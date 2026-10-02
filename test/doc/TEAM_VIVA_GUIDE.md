# Hotel Booking Cancellation Prediction — team division and viva guide

Prepared on 1 October 2026 from the notebook, CSV, and project documents. This guide allocates **study and explanation responsibility**; it does not establish who originally wrote each statement. Describe your actual work honestly in the viva.

## Read this first: complete project

The project predicts whether a hotel booking will be canceled. Each dataset row describes one booking. The target is `is_canceled`: **0 = not canceled; 1 = canceled**. Because historical examples have known labels and there are two outcomes, this is **supervised binary classification**.

Hotel managers, reservation staff, revenue teams, and operational planners could use risk estimates to prioritize follow-up and plan occupancy/resources. A prediction is decision-support information, not a guaranteed outcome or a reason to automatically reject a customer.

Everyone must understand the complete workflow, even though the detailed explanation is divided among members. The assignment explicitly assesses individual understanding.

| Current file | Meaning |
|---|---|
| [new.ipynb](new.ipynb) | Complete EDA, cleaning, feature engineering, split, baseline comparison, tuning, evaluation, saving, and sample prediction. |
| [hotel_bookings.csv](hotel_bookings.csv) | Original historical booking data. |
| [best_hotel_cancellation_model.joblib](best_hotel_cancellation_model.joblib) | Dictionary containing the fitted pipeline and metadata, including required features and metrics after running the saving cell. |
| [NOTEBOOK_CODE_REFERENCE.md](NOTEBOOK_CODE_REFERENCE.md) | Exact source of every code cell, with cell-local line numbers. |
| [doc/FDM.pdf](doc/FDM.pdf) | Formatted dataset proposal, including member names and IDs, source, scenario, planned models, and limitations. |
| [Expanded proposal](doc/IT3051_Hotel_Booking_Dataset_Proposal_Expanded.pdf) | Another proposal version describing the same dataset and planned workflow. |
| [Official assignment](doc/IT3051_FDM_Mini_Project_Assignment_2026.pdf) | Required stages, individual evaluations, integrated application, report, and final demonstration. |
| [Technical report](doc/IT3051_Final_Technical_Report_Hotel_Booking.pdf) | Existing report draft; later sections still contain placeholders and need actual results. |
| [Implementation guide](doc/IT3051_VSCode_Codex_Full_Project_Guide.pdf) | Suggested complete-project deliverables; several application/report-evidence items remain future work. |

The proposal identifies the Kaggle distribution by Jesse Mostipak as the download source and Antonio, de Almeida, and Nunes (2019), *Hotel booking demand datasets*, as the original research publication. See `FDM.pdf`, pages 4–5, and the technical report, page 5. The report states instructor approval was obtained; a separate signed approval record is not visible in the inspected files.

### Workflow everyone should explain

1. Define the cancellation problem, target, users, and intended inputs/output.
2. Load and inspect the original CSV; examine missing values, duplicates, types, distributions, and patterns.
3. Copy the data, remove exact duplicates, fill missing values, and create four derived features.
4. Remove `reservation_status` and `reservation_status_date` because they disclose outcome information.
5. Separate input matrix `X` from label vector `y`; make a stratified 80/20 training/test split.
6. Compare Logistic Regression, Decision Tree, Random Forest, and Extra Trees with three-fold stratified cross-validation on training data.
7. Tune Random Forest and Logistic Regression; select the highest training CV ROC-AUC and refit on all training rows.
8. Test feature engineering with an ablation; evaluate the selected model on the held-out test partition.
9. Show metric tables and comparison/confusion-matrix/ROC/precision-recall plots.
10. Save the fitted pipeline and metadata, reload it, and predict one held-out booking.

Run the notebook **top to bottom**, not in member order. Later cells depend on earlier variables. The continuation does not reload the CSV, repeat the cleaned-data feature creation, or make another split. It clones the Stage 5 transformer templates inside each modeling pipeline, so preprocessing is fitted separately for each CV training fold. The preliminary `X_train_processed` array is not the input to the Stage 6 models.

The notebook calls its split/preprocessing section Stage 5; the official assignment calls Stage 5 **Progress Evaluation 1**. Use the official document for assessment numbering and the notebook cell references for code navigation.

### Data facts and feature meanings

| Item | Value / meaning |
|---|---|
| Original dataset | 119,390 rows; 32 columns; City Hotel and Resort Hotel. |
| Period in the proposal | Arrival dates July 2015–August 2017. |
| Raw labels | 75,166 non-canceled; 44,224 canceled (37.04% canceled). |
| Exact duplicates | 31,994; removal leaves 87,396 records. |
| Clean labels | 63,371 non-canceled; 24,025 canceled (about 27.49% canceled). |
| Original missing values | children 4; country 488; agent 16,340; company 112,593. |
| Training/test | 69,916 / 17,480 rows; seed 42; stratified 80/20. |
| Training labels | 50,696 zeros; 19,220 ones. |
| Test labels | 12,675 zeros; 4,805 ones. |
| Input columns | 33: 32 original + 4 derived − 2 leakage − 1 target. |
| Actual modeling input groups | 21 numeric and 12 categorical after agent/company become strings. |

Duplicate removal changes class balance. **Do not describe the cleaned training data as 37% canceled.** Predicting all clean/test records as non-canceled would give about 72.51% accuracy, which illustrates why accuracy alone is insufficient.

| Feature group | Fields and meanings |
|---|---|
| Hotel and arrival | `hotel`, arrival year/month/week/day: property category and planned arrival timing. |
| Booking/stay timing | `lead_time`: days from booking to arrival; weekend/week nights: planned stay; waiting-list days: queue duration. |
| Guests | `adults`, `children`, `babies`: counts; `country`: country code. |
| Sales/customer categories | `meal`, `market_segment`, `distribution_channel`, `customer_type`, `deposit_type`: booking arrangements and customer/channel categories. TA/TO means travel agents/tour operators. |
| Booking history | Repeat-guest flag, previous cancellations, previous non-canceled bookings. |
| Rooms/changes | Reserved/assigned room codes and number of booking changes. |
| Identifiers | `agent`, `company`: category labels, not quantities. Zero represents missing/no recorded identifier in this implementation. |
| Price/requests | `adr`: average daily rate; required parking spaces; number of special requests. |
| Outcome | `is_canceled` is the label; final reservation status/date are excluded. |

Derived features are `total_nights = weekend nights + week nights`, `is_long_stay = total_nights > 7`, `is_weekend_stay = weekend nights > 0`, and `is_high_lead_time = lead_time > 60`. Boolean indicators become 0/1 integers. Exactly seven nights or sixty days does not satisfy the corresponding strict `>` rule. These are chosen thresholds, not learned optimal thresholds. `total_guests` was proposed but is not implemented.


The modeling continuation is written as explicit statements without custom `def` or `lambda`. Each model cell shows its own pipeline, CV call, and metric dictionary. A shared unfitted preprocessing template avoids repeating the completed Stage 5 preparation. The saved model uses built-in pandas operations for identifier filling/type conversion, so no custom helper module is required.

Refactor verification: all 17,480 held-out labels match the previously verified fitted model, and probabilities agree within floating-point tolerance. Explicit training/tuning/selection/ablation cells were also executed on a reduced verification dataset; their smoke-test scores do not replace the full-data results below.

## Balanced named allocation

This allocation preserves the early contribution areas in the technical report, pages 12–13, and adds a modeling responsibility to each member. The earlier provisional chat allocation is superseded by this document-based allocation.

There are 69 notebook code cells, so equal whole-cell counts are impossible: the allocation is **18 / 17 / 17 / 17**. Cell complexity differs. The intended balance is approximately 25% of study/presentation responsibility per member, with **four minutes speaking time each**, twelve individual questions each, and shared complete-project preparation.

| Member | Name/ID from project documents | Main area | Modeling area | Code cells |
|---|---|---|---|---:|
| Subasthican | Manoharan Subasthican — IT23810778 | Categorical EDA and leakage | Logistic Regression/tuning, comparison and selection | 17 |
| Kajeepan | Kuganesan Kageepan — IT23717572 | Numeric/room EDA and feature engineering | Decision Tree, final metrics/plots and example | 17 |
| Gowsika | Gowsika Surendran — IT23794566 | Data structure, missingness, labels and duplicates | Random Forest/tuning and feature ablation | 18 |
| Seyon | Kokulan Seyon — IT23752672 | Country/cardinality, preprocessing and split | Pipeline setup, Extra Trees and saving | 17 |

The documents spell Kajeepan's name **Kageepan**. This guide keeps the short name requested in chat while recording the document spelling for formal submissions.

### How code line references work

Cell positions are counted from 1 and include Markdown cells. Older `# Cell ...` comments may differ from actual positions. Tables below give the original code file, actual notebook cell, **lines within that cell**, and physical notebook JSON source-block lines. The linked reference displays exact statements with numbered lines. JSON ranges include source-array brackets; outputs/images can change those physical numbers after a rerun. Prefer cell position plus cell-local lines.

## Subasthican — categorical EDA, Logistic Regression, comparison

Explain how cancellation rates differ by hotel, month, customer, market, deposit, and channel. For a binary target, its mean equals the canceled proportion. Distinguish group size from cancellation rate, and describe patterns as associations rather than causes. Calendar month ordering improves interpretation. Very small groups require caution.

Explain leakage identification/removal, the explicit per-model CV calculations, Logistic Regression, grid search, and final comparison. Logistic Regression learns a linear score and converts it to probability with a sigmoid. Larger `C` means weaker regularization. The grid evaluates three C values and two class-weight options. Candidate ranking uses training CV, and the winning pipeline is cloned/refitted without consulting test scores.

**Presentation:** one minute categorical findings; one minute leakage/fair validation; one minute Logistic Regression/tuning; one minute candidate selection. **Handoff:** explain categorical patterns to Seyon and compare every member's model using the same CV settings.

| Code file / actual cell | Cell-local lines | Notebook JSON lines | Code meaning |
|---|---:|---:|---|
| [new.ipynb cell 13](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-13) | 1?8 | 399?408 | Plot label counts; explain moderate raw class imbalance. |
| [new.ipynb cell 14](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-14) | 1?11 | 437?449 | Mean binary target by hotel gives City 41.73% and Resort 27.76% raw cancellation rates. |
| [new.ipynb cell 15](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-15) | 1?12 | 488?501 | Reindex months to calendar order and plot mean target by month. |
| [new.ipynb cell 16](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-16) | 1?11 | 532?544 | Compare customer-type cancellation proportions. |
| [new.ipynb cell 17](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-17) | 1?11 | 579?591 | Compare market segments; Undefined has only two rows. |
| [new.ipynb cell 18](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-18) | 1?11 | 621?633 | Compare deposit types; Non Refund association is not proof of cause. |
| [new.ipynb cell 19](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-19) | 1?11 | 665?677 | Compare distribution-channel cancellation rates; check category sample sizes. |
| [new.ipynb cell 34](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-34) | 1?5 | 1207?1213 | Flag reservation_status and reservation_status_date as leakage fields. |
| [new.ipynb cell 35](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-35) | 1?3 | 1230?1234 | Explain why final reservation status reveals the outcome. |
| [new.ipynb cell 44](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-44) | 1?5 | 1433?1439 | Remove both outcome fields; errors=ignore tolerates already absent columns. |
| [new.ipynb cell 62](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-62) | 1?8 | 1879?1888 | Initialize result containers and seven CV scoring metrics; individual training and result calculations appear explicitly in each model cell. |
| [new.ipynb cell 63](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-63) | 1?29 | 1976?2006 | Build Logistic Regression pipeline, run cross-validation, calculate metrics, update its result row and display results directly. |
| [new.ipynb cell 67](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-67) | 1?5 | 2489?2495 | Sort and display baseline CV results by mean ROC-AUC. |
| [new.ipynb cell 68](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-68) | 1?15 | 2521?2537 | Plot CV AUC with fold standard deviations and grouped accuracy/precision/recall/F1 bars. |
| [new.ipynb cell 71](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-71) | 1?22 | 2622?2645 | Write the Logistic Regression tuning pipeline directly, then evaluate six C/weight combinations and refit the best. |
| [new.ipynb cell 72](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-72) | 1?17 | 2741?2759 | Rank four baseline and two tuned candidates using training CV AUC. |
| [new.ipynb cell 73](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-73) | 1?16 | 2784?2801 | Clone/refit the top-ranked candidate on all training rows before testing. |

### Twelve viva questions and answers

1. **Why does mean of the target give cancellation rate?** Ones count cancellations and zeros add nothing. Dividing their sum by group size gives the canceled proportion.
2. **Count versus rate?** Count is number of bookings. Rate is canceled bookings divided by all bookings in the group; larger count does not imply larger rate.
3. **What hotel pattern appears?** Raw City Hotel cancellation is about 41.73%, versus Resort Hotel 27.76%. These are pre-cleaning historical associations.
4. **Why order months?** Calendar order exposes seasonal patterns; alphabetical order can obscure them.
5. **Does Non Refund cause cancellations?** No. Its raw cancellation rate is about 99.36%, but observational association does not establish causality.
6. **Can 100% cancellation be misleading?** Yes. Undefined market segment has only two raw rows. Its rate cannot support a confident general rule.
7. **What is leakage?** Outcome-related information unavailable at prediction time can create unrealistic performance. Final reservation status and its date are excluded.
8. **How does Logistic Regression predict?** It learns weights for a linear score and applies a sigmoid to estimate a binary-class probability.
9. **What does C control?** Inverse regularization strength. Smaller C regularizes more strongly; the grid tests 0.3, 1.0, and 3.0.
10. **What is balanced class weighting?** It weights training loss inversely to class frequency. It is not SMOTE or duplication and does not guarantee better recall.
11. **How many grid combinations?** Three C values times two weight settings equals six, each assessed with three folds before refitting the best.
12. **How is the winner chosen?** Rank four baseline and two tuned candidates by mean training CV ROC-AUC, then refit the top candidate on all training rows.

## Kajeepan — numeric EDA, Decision Tree, final evaluation

Explain reserved rooms, lead time, ADR, stay length, and requests. Histograms show distributions; box plots compare medians, quartiles, spread, and potential outliers. Raw ADR ranges from −6.38 to 5400 and deserves investigation; no clipping/removal is performed. Correlation describes linear numeric association and does not prove cause.

Explain the four engineered features, Decision Tree restrictions, test metrics, plots, and the one-booking example. A tree makes successive feature-rule splits. Limiting depth and minimum leaf size reduces complexity but does not guarantee absence of overfitting. Interpret precision and recall specifically for cancellation class 1. The sample uses the saved/reloaded pipeline, not a newly trained model.

**Presentation:** one minute numeric/room findings; one minute engineered fields/Decision Tree; one minute test metrics; one minute error plots/example. **Handoff:** explain modeling errors with Subasthican's selected candidate and Seyon's saved pipeline.

| Code file / actual cell | Cell-local lines | Notebook JSON lines | Code meaning |
|---|---:|---:|---|
| [new.ipynb cell 20](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-20) | 1?11 | 714?726 | Compare reserved-room codes; P has only twelve raw rows. |
| [new.ipynb cell 21](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-21) | 1?8 | 745?754 | Histogram/KDE of lead_time describes booking-to-arrival days. |
| [new.ipynb cell 22](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-22) | 1?8 | 773?782 | Histogram/KDE of ADR describes price distribution and extreme values. |
| [new.ipynb cell 23](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-23) | 1?8 | 801?810 | Box plot compares lead-time medians/spread by outcome. |
| [new.ipynb cell 24](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-24) | 1?8 | 829?838 | Box plot compares ADR by outcome; no outlier treatment is applied. |
| [new.ipynb cell 25](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-25) | 1?4 | 859?864 | Compute total_nights as weekend nights plus week nights for EDA. |
| [new.ipynb cell 26](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-26) | 1?8 | 883?892 | Box plot compares total stay length by outcome. |
| [new.ipynb cell 27](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-27) | 1?11 | 921?933 | Compare mean special requests: raw non-canceled 0.7141 vs canceled 0.3288. |
| [new.ipynb cell 30](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-30) | 1?8 | 1026?1035 | Calculate numeric correlations and plot heatmap; association is not causality. |
| [new.ipynb cell 31](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-31) | 1?3 | 1051?1055 | Identify numeric fields; IDs are reconsidered as categories in Stage 6. |
| [new.ipynb cell 32](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-32) | 1?2 | 1162?1165 | Inspect count/mean/std/quartiles/extrema; ADR ranges from -6.38 to 5400. |
| [new.ipynb cell 36](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-36) | 1?6 | 1254?1261 | Summarize observed EDA associations; do not interpret wording as causal proof. |
| [new.ipynb cell 43](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-43) | 1?7 | 1408?1416 | Recompute stay length and add strict >7, >0 weekend, and >60 indicators. |
| [new.ipynb cell 64](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-64) | 1?29 | 2094?2124 | Build Decision Tree pipeline, run cross-validation, calculate metrics, update its result row and display results directly. |
| [new.ipynb cell 75](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-75) | 1?48 | 3077?3126 | Use built-in pandas fillna/astype operations in the saved pipeline; compute nine held-out metrics and exact confusion counts. |
| [new.ipynb cell 76](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-76) | 1?23 | 3152?3176 | Plot held-out confusion matrix, ROC curve and precision-recall curve. |
| [new.ipynb cell 78](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-78) | 1?19 | 3512?3532 | Use reloaded model for one held-out booking; show all inputs, label, probability, actual outcome and correctness. |

### Twelve viva questions and answers

1. **What is lead time?** Days between booking and planned arrival; it is not the duration of the stay.
2. **What is ADR?** Average daily rate, a price-related variable. Extreme and negative values are investigated but not removed in this notebook.
3. **Why a box plot?** It compares medians, quartiles, spread, and potential outliers between outcome groups.
4. **What does the heatmap show?** Pairwise numeric correlations. It can miss nonlinear effects and cannot establish causation.
5. **How is total_nights computed?** Weekend nights plus week nights. The other indicators test >7 total nights, >0 weekend nights, and >60 lead-time days.
6. **How does a Decision Tree work?** It repeatedly splits examples using feature rules and predicts from the class distribution in the reached leaf.
7. **Why restrict tree depth/leaf size?** To avoid very detailed rules supported by few records. Here depth is 20 and minimum leaf size 5.
8. **What is precision?** Of bookings flagged as cancellation, the proportion actually canceled: TP/(TP+FP).
9. **What is recall?** Of actual canceled bookings, the proportion detected: TP/(TP+FN).
10. **What are specificity and MCC?** Specificity is recall for non-canceled bookings, TN/(TN+FP). MCC uses all confusion entries and ranges from −1 to 1; closer to 1 is better.
11. **What does ROC-AUC mean?** Ranking separation over thresholds, not percent correct at the 0.5 threshold. The precision-recall curve focuses on cancellation alerts and detection.
12. **What does one correct sample prove?** Only that this example was predicted correctly and the saved model can process it. General performance comes from the whole held-out evaluation.

## Gowsika — data validation, cleaning, Random Forest, ablation

Explain dataset size, column types, missing counts, labels, duplicates, and unique category counts. Removing exact duplicates before splitting reduces repeated examples across partitions and changes label proportions. Identical rows can also represent separate genuine bookings, so this cleaning assumption should be acknowledged.

Explain median filling for children and the Random Forest. A forest trains many trees using bootstrap samples and feature randomness, then averages class probabilities. Randomized search explores four combinations from a 24-combination grid. Its parameters control tree count, depth, minimum leaf size, and fraction of transformed features considered at each split. Ablation removes four derived features while retaining their original ingredients; it does not retune the model without them.

**Presentation:** one minute data quality/labels; one minute cleaning; one minute forest/tuning; one minute ablation/limitations. **Handoff:** provide cleaned data to Seyon's split and explain the forest candidate to Subasthican.

| Code file / actual cell | Cell-local lines | Notebook JSON lines | Code meaning |
|---|---:|---:|---|
| [new.ipynb cell 2](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-2) | 1?16 | 35?52 | Import the analysis/preprocessing libraries; warning suppression hides warnings rather than fixing them. |
| [new.ipynb cell 3](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-3) | 1?7 | 70?78 | Read CSV into df; print original shape and row/column counts. |
| [new.ipynb cell 4](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-4) | 1?2 | 97?100 | Preview five bookings and connect field values to the scenario. |
| [new.ipynb cell 5](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-5) | 1?2 | 150?153 | List original columns, including target and outcome-related fields. |
| [new.ipynb cell 6](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-6) | 1?2 | 204?207 | Inspect data types before choosing different transformations. |
| [new.ipynb cell 7](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-7) | 1?2 | 261?264 | Display types, non-null counts, and memory usage. |
| [new.ipynb cell 8](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-8) | 1?3 | 287?291 | Count and rank missing fields: company, agent, country, children. |
| [new.ipynb cell 9](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-9) | 1?2 | 310?313 | Count 31,994 exact repeated rows. |
| [new.ipynb cell 10](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-10) | 1?2 | 335?338 | Count raw labels: 75,166 zeros and 44,224 ones. |
| [new.ipynb cell 11](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-11) | 1?2 | 360?363 | Calculate raw target proportions: 62.96% / 37.04%. |
| [new.ipynb cell 33](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-33) | 1?5 | 1184?1190 | Count distinct hotels/countries/segments/customer types: 2/177/8/4. |
| [new.ipynb cell 38](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-38) | 1?3 | 1294?1298 | Copy df to retain the original EDA dataframe separately. |
| [new.ipynb cell 39](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-39) | 1?3 | 1314?1318 | Remove exact duplicates, leaving 87,396 rows and a changed label balance. |
| [new.ipynb cell 40](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-40) | 1?3 | 1334?1338 | Fill children using cleaned-data median; pre-split learning is a limitation. |
| [new.ipynb cell 57](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-57) | 1?15 | 1759?1775 | Print hard-coded True checklist entries; distinguish checklist from executable checks. |
| [new.ipynb cell 65](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-65) | 1?29 | 2212?2242 | Build Random Forest pipeline, run cross-validation, calculate metrics, update its result row and display results directly. |
| [new.ipynb cell 70](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-70) | 1?26 | 2571?2598 | Write the forest tuning pipeline directly, then evaluate four sampled parameter combinations and refit the best. |
| [new.ipynb cell 74](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-74) | 1?25 | 2873?2899 | Write the ablated ColumnTransformer directly and evaluate without engineered features using fixed selected settings. |

### Twelve viva questions and answers

1. **What is one record?** One booking record, with input characteristics and a historical cancellation label.
2. **How large is the data?** 119,390 rows and 32 columns before cleaning; 87,396 rows after exact duplicate removal.
3. **Missing value versus duplicate?** Missing means absent information in a field. Duplicate means a complete repeated row. Their treatments differ.
4. **Which fields are missing?** Raw children 4, country 488, agent 16,340, and company 112,593.
5. **Why can accuracy mislead?** A majority-only prediction achieves about 72.51% on clean/test labels while detecting no cancellations.
6. **Why remove duplicates before splitting?** To reduce identical examples appearing across partitions and repeated-row overrepresentation. It also assumes those duplicates are redundant rather than distinct legitimate bookings.
7. **Why median children filling?** It gives a robust central value. Here it was computed before splitting, a methodological limitation even though only four raw values were missing.
8. **How is a forest different from one tree?** It averages many randomized trees, usually reducing variance compared with a single tree and capturing nonlinear interactions.
9. **What was tuned?** n_estimators [100,160], max_depth [None,20], min_samples_leaf [2,5,10], and max_features [sqrt,0.7].
10. **Why randomized search?** It limits computation by checking four sampled combinations rather than all 24. It does not prove global optimality.
11. **What does max_features=0.7 mean?** Roughly 70% of transformed features are considered at a split; it does not mean 70% of records.
12. **What does the ablation demonstrate?** It measures performance after removing the derived features with fixed selected classifier settings and folds. A tiny difference does not establish a significant benefit.

## Seyon — preprocessing, split, pipeline setup, Extra Trees, saving

Explain country concentration and identifier missingness, constant categorical filling, the 80/20 split, and the Stage 5 transformers. `fit_transform` learns on training rows; test `transform` uses those learned rules. Stage 6 clones the existing transformer templates inside every model pipeline, groups rare categories, and encodes agent/company IDs as categories rather than continuous measurements.

Explain Extra Trees and serialization. Extra Trees introduces randomness in split thresholds and uses no bootstrap sampling by default here. The saved artifact is a dictionary containing a deployment pipeline and metadata. The saved pipeline uses built-in pandas filling and type conversion, so no custom function file is needed. The artifact still expects cleaned/engineered Stage 5-compatible columns; it does not itself implement all raw CSV cleaning and feature engineering.

**Presentation:** one minute country/missingness; one minute split/preprocessing; one minute Extra Trees/model setup; one minute saving and input requirements. **Handoff:** maintain the input contract for every model and for Kajeepan's sample demonstration.

| Code file / actual cell | Cell-local lines | Notebook JSON lines | Code meaning |
|---|---:|---:|---|
| [new.ipynb cell 28](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-28) | 1?11 | 970?982 | Count top ten countries; counts measure concentration rather than cancellation rates. |
| [new.ipynb cell 29](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-29) | 1?4 | 1002?1007 | Report agent/company missingness: 13.69% and 94.31%. |
| [new.ipynb cell 41](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-41) | 1?9 | 1354?1364 | Fill missing categories with selected constants such as Unknown. |
| [new.ipynb cell 42](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-42) | 1?5 | 1381?1387 | Fill absent agent/company with zero and cast to integers. |
| [new.ipynb cell 45](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-45) | 1?2 | 1458?1461 | Check whether any missing values remain after cleaning. |
| [new.ipynb cell 46](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-46) | 1?2 | 1480?1483 | Preview cleaned records, engineered inputs and excluded leakage fields. |
| [new.ipynb cell 48](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-48) | 1?6 | 1510?1517 | Separate 33-column X from the is_canceled target y. |
| [new.ipynb cell 49](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-49) | 1?12 | 1536?1549 | Create the only 80/20 split with stratification and seed 42. |
| [new.ipynb cell 50](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-50) | 1?6 | 1566?1573 | Select preliminary numeric/object category groups; string dtype support differs at Stage 6. |
| [new.ipynb cell 51](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-51) | 1?7 | 1590?1598 | Define numeric template: median imputation plus standard scaling. |
| [new.ipynb cell 52](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-52) | 1?7 | 1615?1623 | Define categorical template: most-frequent imputation plus one-hot encoding. |
| [new.ipynb cell 53](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-53) | 1?7 | 1663?1671 | Combine numeric/category templates using ColumnTransformer. |
| [new.ipynb cell 54](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-54) | 1?6 | 1688?1695 | Learn preliminary transforms from training rows only and transform test rows. |
| [new.ipynb cell 55](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-55) | 1?6 | 1715?1722 | Print stage readiness statements; these do not independently verify correctness. |
| [new.ipynb cell 60](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-60) | 1?29 | 1824?1854 | Normalize identifiers with a visible loop, clone Stage 5 transformer templates, and define model_preprocessor and stratified folds directly; no custom function. |
| [new.ipynb cell 66](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-66) | 1?29 | 2330?2360 | Build Extra Trees pipeline, run cross-validation, calculate metrics, update its result row and display results directly. |
| [new.ipynb cell 77](NOTEBOOK_CODE_REFERENCE.md#notebook-cell-77) | 1?28 | 3200?3229 | Save the fitted pipeline and metadata, reload, and verify sample labels/probabilities; no helper file is needed. |

### Twelve viva questions and answers

1. **What is high cardinality?** A categorical feature has many distinct values. Country has 177 raw categories, which can create many encoded columns.
2. **Why map missing IDs to zero?** Zero is a sentinel for missing/no recorded agent or company in this implementation, not a real business ID. This assumption needs business confirmation.
3. **Why convert IDs to strings?** Their numbers are labels rather than ordered measurements; one-hot encoding avoids imposing numeric distance.
4. **Why split training/test?** Training/CV supports development. The held-out test partition assesses the selected model after development decisions.
5. **What does stratify=y do?** It preserves approximately the cleaned cancellation proportions across the two partitions.
6. **What does random_state=42 do?** It fixes random choices for repeatability in the same setup; 42 has no special predictive value.
7. **Why one-hot encoding?** It represents nominal categories with binary indicators without introducing an artificial ordering.
8. **What happens with unseen categories?** handle_unknown='ignore' avoids an error and uses zeros for that categorical group under this configuration. It does not guarantee accurate predictions for unfamiliar input.
9. **Why clone the transformers for CV?** To fit preprocessing independently on each training fold, so validation rows do not determine learned statistics or categories.
10. **Why scale numeric inputs?** It helps scale-sensitive classifiers such as Logistic Regression. Trees generally do not need it, but the shared template keeps comparison consistent.
11. **What is Extra Trees?** An ensemble using randomized split thresholds. Its default bootstrap is false here, whereas Random Forest uses bootstrap sampling by default.
12. **What must accompany the model file?** The required input columns and compatible packages. No custom helper file is needed. The artifact expects already cleaned/engineered features.

## Results and interpretation everyone must prepare

The verified run selected **Tuned Random Forest**: 100 trees, depth 20, minimum leaf size 2, and max_features 0.7. Training CV ROC-AUC is **0.9125**; held-out accuracy is **85.08%** and ROC-AUC **0.9158**. Cancellation precision is **75.43%** and recall **67.80%**. Without the engineered features, CV AUC is slightly higher; the difference is approximately −0.0001 for including them, so this experiment does not establish a useful performance gain from those features.

The saved pipeline was also loaded in a **separate Python process** and successfully predicted a prepared booking row. This verifies built-in identifier normalization and model loading; it does not constitute frontend/backend system testing.

### Baseline cross-validation comparison

```text
Model  CV ROC-AUC mean  CV ROC-AUC std  CV Accuracy  \
0        Random Forest           0.9097          0.0015       0.8474   
1          Extra Trees           0.9058          0.0017       0.8435   
2  Logistic Regression           0.8640          0.0026       0.8062   
3        Decision Tree           0.8476          0.0025       0.8166   

   CV Balanced Accuracy  CV Precision  CV Recall   CV F1  \
0                0.7729        0.7887     0.6075  0.6863   
1                0.7677        0.7802     0.5994  0.6779   
2                0.7227        0.6893     0.5372  0.6038   
3                0.7630        0.6744     0.6439  0.6587   

   CV Average Precision  Train-validation ROC-AUC gap  
0                0.7996                        0.0762  
1                0.7909                        0.0811  
2                0.6912                        0.0027  
3                0.6624                        0.1144
```

### Baseline and tuned candidates

```text
Model  CV ROC-AUC      Type
0           Tuned Random Forest      0.9125     Tuned
1        Baseline Random Forest      0.9097  Baseline
2          Baseline Extra Trees      0.9058  Baseline
3     Tuned Logistic Regression      0.8644     Tuned
4  Baseline Logistic Regression      0.8640  Baseline
5        Baseline Decision Tree      0.8476  Baseline
```

### Selected model

```text
Selected model: Tuned Random Forest
Training CV ROC-AUC: 0.9125
Final model refit on all Stage 5 training rows; test set remains unused.
```

### Feature ablation

```text
Feature set  CV ROC-AUC
0     With engineered features      0.9125
1  Without engineered features      0.9126

Engineering AUC difference: -0.0001
```

### Held-out evaluation

```text
Selected model: Tuned Random Forest

Metric   Score
0           Accuracy  0.8508
1  Balanced Accuracy  0.7972
2          Precision  0.7543
3             Recall  0.6780
4                 F1  0.7142
5            ROC-AUC  0.9158
6  Average Precision  0.8123
7        Specificity  0.9163
8                MCC  0.6152

precision    recall  f1-score   support

Not canceled       0.88      0.92      0.90     12675
    Canceled       0.75      0.68      0.71      4805

    accuracy                           0.85     17480
   macro avg       0.82      0.80      0.81     17480
weighted avg       0.85      0.85      0.85     17480

Predicted not canceled  Predicted canceled
Actual not canceled                   11614                1061
Actual canceled                        1547                3258
```

### One-booking prediction

```text
Booking input (all required features):

Value
hotel                                City Hotel
lead_time                                   243
arrival_date_year                          2017
arrival_date_month                       August
arrival_date_week_number                     31
arrival_date_day_of_month                     4
stays_in_weekend_nights                       0
stays_in_week_nights                          1
adults                                        2
children                                    0.0
babies                                        0
meal                                         BB
country                                     NLD
market_segment                        Online TA
distribution_channel                      TA/TO
is_repeated_guest                             0
previous_cancellations                        0
previous_bookings_not_canceled                0
reserved_room_type                            A
assigned_room_type                            A
booking_changes                               1
deposit_type                         No Deposit
agent                                         9
company                                       0
days_in_waiting_list                          0
customer_type                   Transient-Party
adr                                       112.5
required_car_parking_spaces                   0
total_of_special_requests                     1
total_nights                                  1
is_long_stay                                  0
is_weekend_stay                               0
is_high_lead_time                             1

Booking index Actual outcome     Predicted outcome  \
0         117514   Not canceled  Not likely to cancel   

   Cancellation probability  Prediction correct  
0                    0.2267                True

Cancellation probability: 22.67%
```


The notebook includes accuracy, balanced accuracy, cancellation precision/recall/F1, ROC-AUC, average precision, specificity, and MCC for final evaluation. It also prints a class-by-class classification report and exact confusion-matrix counts. Baseline comparisons include CV metrics and train-minus-validation AUC gaps.

Treat cancellation as positive: TP is correctly flagged cancellation; FP is a false cancellation alert; FN is a missed cancellation; TN is correctly retained non-cancellation. Accuracy is (TP+TN)/all; precision TP/(TP+FP); recall TP/(TP+FN); F1 is the harmonic mean of precision and recall. Balanced accuracy averages the recalls of both classes. Average precision summarizes the precision-recall curve. Fold standard deviations in the baseline AUC plot are **not confidence intervals**.

Lowering the decision threshold usually flags more bookings, increasing cancellation recall and false positives; precision may decrease. Threshold choice depends on intervention costs and should be developed on validation data, not repeatedly optimized on the final test set. Probabilities are estimates; calibration is not assessed here.

## Document review and remaining assignment work

| Evidence | Finding | What to say / complete |
|---|---|---|
| Official assignment pp. 1–4 | PE1 30%, PE2 30%, presentation/demo 20%, technical report 20%; individual understanding is required. | Prepare the full workflow plus your own technical choices. |
| Official assignment p. 3, Stage 9 | A functional input-validation/prediction backend is required. | No application backend is present in the inspected project. The model alone do not fulfill this stage. |
| Official assignment pp. 3–4, Stage 10 | User-friendly frontend integrated with backend is required. | No frontend source is present. Do not claim a finished hotel application. |
| Report pp. 9–14 | PENDING/FINAL RESULT REQUIRED placeholders remain. | Update baseline/tuning/final results, model settings, system testing, contributions, architecture and conclusion with verified evidence. |
| Proposal/model guide and report | They list Gradient Boosting; notebook implements Extra Trees as the fourth model. | Extra Trees is a distinct classifier, not boosting. Align the report with the implemented comparison; the official assignment requires four suitable algorithms rather than naming a required fourth one. |
| Report p. 8 | 254 processed features describes preliminary Stage 5 output. | Stage 6 changes identifier encoding and rare-category grouping; do not assume its transformed feature count is 254. |
| Official assignment deadlines | General dates have a Northern Uni/KandyUni exception. | Your group is Northern Uni. Follow dates communicated by staff rather than assuming the general deadline applies unchanged. |
| Report p. 5 | Instructor approval is stated. | Keep actual approval evidence for submission; do not create a new approval claim based only on this guide. |

Possible future work allocation, **not existing implementation**: Seyon handles model-loading/input-preparation backend; Subasthican handles user input form and explanatory results; Gowsika handles end-to-end tests and experiment evidence; Kajeepan handles report reconciliation, figures, and demonstration materials. Everyone reviews the combined system and its validation. These tasks currently have no code-file/line references because the files do not yet exist.

## Shared viva questions

**Explain the project in one minute.** We inspect historical bookings, clean duplicates/missing fields, create stay/timing features, remove two outcome fields, and make a stratified split. Four classifiers use training-only three-fold CV with preprocessing inside pipelines. Two are tuned, the highest CV AUC candidate is selected/refitted, then evaluated on held-out bookings, saved, reloaded, and demonstrated with one booking.

**What is training versus validation versus test?** Training fits parameters. Validation folds assess candidates during development. The final test set estimates performance after selection. Repeatedly selecting based on test metrics weakens its independence.

**Can you claim no leakage?** No. Important outcome fields are excluded and CV preprocessing is fitted within folds, but early children median filling occurs before splitting. Whole-data EDA informs decisions, and retained timing-sensitive fields need a clearly defined prediction point.

**Why can test AUC differ from CV AUC?** They evaluate different rows and models trained on different amounts of data. Sampling variation can make test AUC slightly higher or lower.

**Does engineered feature improvement prove a benefit?** No. Small differences without uncertainty analysis can be noise, and ablation holds model settings fixed rather than retuning both representations.

**What is an important next improvement?** Define when prediction occurs, verify every feature is available then, move learned early preprocessing into fold pipelines, and test on future periods. Add probability-calibration and operational threshold evaluation.

**Is this production-ready?** It is a notebook/model prototype. The required frontend/backend, complete raw-input preparation, system testing and deployment monitoring are not implemented in the inspected source.

**What is your contribution?** Identify the statements you personally implemented, reviewed or verified, explain one decision and limitation, and distinguish preparation allocation from actual authorship.

## Known technical limitations and demonstration notes

- The data covers two historical hotels; generalization to current markets or different hotels is not established.
- assigned_room_type, booking_changes and waiting-list information may not exist at an early booking-time prediction. Their availability must be verified.
- Company is about 94.31% missing. Identifier zero filling assumes an absence meaning that may differ from unknown data.
- Outliers were investigated, not removed. No SMOTE, total_guests feature, threshold optimization, or calibration experiment is implemented.
- Early children imputation computes a median before the split; the later fold pipelines cannot undo this early learned operation.
- Stage 5 categorical selection includes object dtype only; Stage 6 includes object/string/category. Preserve awareness of pandas dtype differences when interpreting preliminary processed matrices.
- The final example's former uncommented description has been fixed. Use executed outputs rather than assuming old saved outputs prove current source runs.
- Keep the notebook, model file and dataset in the project directory. Use the project Python environment and run notebook cells in order. Running the saving cell overwrites the current model artifact.
- The sample prints every required input field, true outcome, predicted outcome, estimated cancellation probability and correctness. One sample is illustrative; use held-out aggregate results for performance claims.

Before the viva, each member should be able to explain their code lines without reading memorized answers, state the clean dataset/split sizes, distinguish associations from causes, explain the winner and metrics, and identify what remains incomplete in the assignment.
