export type Booking = Record<string, string>;
export type ModelInfo = {
  model: string;
  metrics: Record<string, number>;
  threshold: number;
  training_cv_roc_auc: number;
  categories: Record<string, string[]>;
  example: Record<string, string | number>;
  groups: [string, string[]][];
  labels: Record<string, string>;
  limits: Record<string, number>;
  optional: Record<string, string | number>;
};
export type Assessment = {
  prediction: number;
  outcome: string;
  cancellation_probability: number;
  retention_probability: number;
  risk_band: 'Low' | 'Moderate' | 'High';
  recommendation: string;
  total_nights: number;
  model: string;
  threshold: number;
  note: string;
};
export type SavedAssessment = {
  booking: Booking;
  assessment: Assessment;
  assessed_at: string;
};
