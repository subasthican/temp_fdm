# Progress Evaluation 2 — speaker guide

Editable deck: StayWise_Progress_Evaluation_2.pptx

Suggested core delivery: about 16 minutes, with roughly four minutes per member. Adjust to the evaluator’s time limit. Shared slides can be brief introductions or viva references.

The allocation below follows TEAM_VIVA_GUIDE.md and describes speaking/study responsibility. Confirm actual individual contributions before presenting.

**Evidence limitation:** the current model file raises a zlib decompression error when loaded. The presentation reports existing full-data notebook/document results; it does not claim the artifact was freshly revalidated. Resolve the artifact before any live prediction demonstration.

## Slide 1: Hotel booking cancellation prediction
Presenter: Team introduction

Introduce the team. PE2 is an individual evaluation worth 30%, focused on official Stages 6 and 7. This deck supports the viva; every member must understand the complete workflow.

## Slide 2: The modelling question
Presenter: Subasthican

Describe the cancellation risk estimate as decision support. Do not claim measured financial savings or guaranteed outcomes. Explain the difference between the modelling evaluation and the final business demonstration.

## Slide 3: Data carried forward from Evaluation 1
Presenter: Gowsika

Explain why removing duplicates changes the class balance. Children use zero, country Unknown, and missing agent/company zero; identifiers become categorical strings for modelling. ADR outliers were investigated but not clipped. Source: Mostipak Kaggle distribution and Antonio et al. (2019).

## Slide 4: Validation protects the test set
Presenter: Seyon

Test labels: 12,675 kept and 4,805 canceled. Cross-validation alternates training and validation folds; the separate test set is not a tuning input. Numeric median imputation and StandardScaler; categorical imputation and one-hot encoding with infrequent-category grouping at min_frequency=50. Stratification preserves class proportions. Random splitting does not prove future-period performance.

## Slide 5: Four algorithms, four useful comparisons
Presenter: All members

Each member explains the algorithm allocated in the team guide. Ensembles can capture interactions; their empirical advantage is supported by validation, while precise causal reasons for a score difference are not established.

## Slide 6: Metrics answer different questions
Presenter: Kageepan

Positive class is cancellation. Precision = TP/(TP+FP); recall = TP/(TP+FN); F1 is their harmonic mean. Balanced accuracy averages class recalls. Average precision summarizes the precision-recall curve. ROC-AUC is not accuracy, and a high AUC does not establish calibrated probabilities.

## Slide 7: Baseline comparison: same folds and pipeline
Presenter: Subasthican

All values are three-fold training CV means, rounded to four decimals. Random Forest ranks first by ROC-AUC; Decision Tree has greater recall than baseline Forest but lower precision and AUC. This illustrates why the selection metric must be stated before comparing models.

## Slide 8: Validation ranking and overfitting signals
Presenter: Seyon

The horizontal axis starts at zero. Baseline train minus validation AUC gaps are LR .0027, DT .1144, RF .0762, ET .0811. A larger gap suggests overfitting, but does not alone decide the winner. Fold AUC standard deviations are .0026, .0025, .0015 and .0017 respectively; these are not confidence intervals.

## Slide 9: Random Forest: constrained randomized search
Presenter: Gowsika

The full parameter space has 24 combinations, but only four were sampled with seed 42. Do not call this exhaustive search. Depth and minimum leaf size control complexity. n_jobs=-1 inside Forest and search n_jobs=1 avoid nested parallelism. The limited budget is a limitation.

## Slide 10: Logistic Regression: small exhaustive grid
Presenter: Subasthican

Balanced class weights alter the training loss inversely to class frequency; they are not oversampling or SMOTE. Same folds and scoring as Forest. A small improvement is observed; no statistical significance claim is supported.

## Slide 11: Final selection uses training evidence
Presenter: Subasthican

Rank all six candidates by training CV AUC. Clone the top candidate and refit on all training rows before testing. The choice follows the declared criterion rather than test-set comparison. The tuning estimates themselves may be optimistic because the same CV supports parameter selection.

## Slide 12: Feature ablation finds no useful gain
Presenter: Gowsika

The ablation removes all four derived columns using fixed selected Forest settings and the same folds. It does not retune both representations. The tiny difference is not evidence of significant harm or benefit. Deployment preparation must reproduce the retained feature rules exactly.

## Slide 13: Held-out results: 17,480 unseen bookings
Presenter: Kageepan

These are recorded full-data held-out metrics, not reduced smoke-test scores. Test evaluation follows selection. Threshold 0.5. Accuracy exceeds the all-kept baseline by about 12.57 percentage points, but recall and precision expose important errors. Saved artifact could not be independently loaded during deck preparation; results were cross-checked against notebook outputs and documented tables.

## Slide 14: The errors matter for hotel operations
Presenter: Kageepan

Rows are actual outcomes and columns are predicted outcomes. TP=3258, FN=1547, FP=1061, TN=11614. Precision 3258/(3258+1061); recall 3258/4805. Missing cancellations affects planning; false alerts require unnecessary follow-up. Decisions remain with staff.

## Slide 15: Limits and the next modelling experiments
Presenter: Gowsika / Seyon

Explain prediction-time leakage beyond explicitly removed status fields. A field can be valid for late-stage assessment yet unavailable when the booking is first made. Fairness/subgroup performance and current-hotel impact remain unmeasured. These are proposed experiments, not completed results.

## Slide 16: Individual preparation and notebook evidence
Presenter: All members

This is a study/speaking allocation, not proof of original authorship. Confirm actual personal contributions and identify exact notebook cells. Suggested core speaking allocation: approximately four minutes each, adjusted to the evaluator’s format. Everyone must be ready to explain the full workflow.

## Slide 17: Evidence and questions
Presenter: All members

Kaggle source recorded in the proposal: https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand. Original publication: https://doi.org/10.1016/j.dib.2018.11.126. This deck uses local project evidence, not a new training run. Backup viva questions: Why AUC? Why stratification? Why a pipeline? Does engineering improve the model? Why not choose on test accuracy?
