export const PROBLEM_STATUSES = [
  'draft',
  'pending_review',
  'review_changes_requested',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
] as const;

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

const STATUS_ALIASES: Record<string, ProblemStatus> = {
  draft: 'draft',
  submitted: 'pending_review',
  pending: 'pending_review',
  pending_review: 'pending_review',
  review_changes_requested: 'review_changes_requested',
  needs_revision: 'review_changes_requested',
  needs_changes: 'review_changes_requested',
  pending_testing: 'pending_testing',
  approved_for_testing: 'pending_testing',
  testing_changes_requested: 'testing_changes_requested',
  awaiting_final_check: 'awaiting_final_check',
  approved: 'awaiting_final_check',
  approve: 'awaiting_final_check',
  completed: 'completed',
  done: 'completed',
  published: 'completed',
  history: 'completed',
  rejected: 'rejected',
  reject: 'rejected',
};

export const DEFAULT_PROBLEM_STATUS: ProblemStatus = 'draft';

export const normalizeProblemStatus = (
  status?: string | null,
): ProblemStatus => {
  if (!status) {
    return DEFAULT_PROBLEM_STATUS;
  }

  const normalized = status.trim().toLowerCase();
  return STATUS_ALIASES[normalized] ?? DEFAULT_PROBLEM_STATUS;
};

export const isProblemStatus = (value: unknown): value is ProblemStatus => {
  return (
    typeof value === 'string' &&
    PROBLEM_STATUSES.includes(value as ProblemStatus)
  );
};

export const REVIEW_STATUS_ORDER: ProblemStatus[] = [
  'pending_review',
  'review_changes_requested',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
];

export const VERIFICATION_STATUS_ORDER: ProblemStatus[] = [
  'pending_review',
  'review_changes_requested',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
];
