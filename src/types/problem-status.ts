export const PROBLEM_STATUSES = [
  'draft',
  'pending_review',
  'needs_revision',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
] as const;

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

const STATUS_ALIASES: Record<string, ProblemStatus> = {
  submitted: 'pending_review',
  pending: 'pending_review',
  review_changes_requested: 'needs_revision',
  needs_changes: 'needs_revision',
  approved_for_testing: 'pending_testing',
  approved: 'awaiting_final_check',
  approve: 'awaiting_final_check',
  done: 'completed',
  published: 'completed',
  history: 'completed',
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

  if (PROBLEM_STATUSES.includes(normalized as ProblemStatus)) {
    return normalized as ProblemStatus;
  }

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
  'needs_revision',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
];

export const VERIFICATION_STATUS_ORDER: ProblemStatus[] = [
  'pending_review',
  'needs_revision',
  'pending_testing',
  'testing_changes_requested',
  'awaiting_final_check',
  'completed',
  'rejected',
];
