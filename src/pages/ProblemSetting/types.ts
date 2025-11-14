import { ProblemStatus } from '../../types/problem-status';

export interface Problem {
  problem_draft_id: string;
  submitted_problem_id?: string; // ID of the submitted problem, if this draft has been submitted
  details: ProblemDetails;
  examples: ProblemExample[];
  problem_difficulty_id: string;
  is_submitted: boolean;
  target_contest_id: string;
  comments: string[];
  created_at: string;
  updated_at: string;
  status?: ProblemStatus;
  // Optional versions (for published problems) - newest first
  versions?: ProblemVersion[];
}

export interface ProblemVersion {
  version_id?: string;
  details: ProblemDetails[];
  examples: ProblemExample[];
  problem_difficulty?: {
    problem_difficulty_id: string;
  };
  review?: {
    reviewer_id: string;
    comment: string;
    decision: string;
    created_at: string;
  };
  test_results?: Array<{
    tester_id: string;
    status: string;
    comment: string;
    created_at: string;
  }>;
  created_at?: string;
}

export interface PublishedProblem {
  problem_id: string;
  problem_draft_id?: string;
  title: {
    language: string;
    title: string;
  }[];
  status: ProblemStatus;
  creator?: {
    user_id: string;
    username: string;
  };
  reviewer?: {
    user_id: string;
    username: string;
  };
  testers?: {
    user_id: string;
    username: string;
  }[];
  target_contest: null | unknown;
  assigned_contest: null | unknown;
  problem_difficulty: {
    problem_difficulty_id: string;
    display_names: {
      language: string;
      display_name: string;
    }[];
  };
  created_at: string;
  updated_at: string;

  // Will be populated after fetching details
  details?: ProblemDetails;
  examples?: ProblemExample[];
  versions?: ProblemVersion[];
}

export interface ProblemDetails {
  language: string;
  title: string;
  background: string;
  statement: string;
  input_format: string;
  output_format: string;
  note: string;
}

export interface ProblemExample {
  input: string;
  output: string;
}

// Payload used when saving a problem draft to the API
export interface SaveProblemPayload {
  problem_draft_id?: string;
  details: ProblemDetails[];
  examples: ProblemExample[];
  problem_difficulty_id: string;
}

export type ViewType = 'list' | 'detail';

export type ProblemType = 'draft' | 'published';

export interface CombinedProblemListItem {
  id: string;
  type: ProblemType;
  title: string;
  status: ProblemStatus;
  created_at: string;
  updated_at: string;
  base_problem_id?: string;
  draft_id?: string;
  originalProblem: Problem | PublishedProblem;
}
