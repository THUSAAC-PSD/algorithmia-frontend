export interface Problem {
  problem_draft_id: string;
  details: ProblemDetails;
  examples: ProblemExample[];
  problem_difficulty_id: string;
  is_submitted: boolean;
  target_contest_id: string;
  comments: string[];
  created_at: string;
  updated_at: string;
  status?: string;
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
  created_at?: string;
}

export interface PublishedProblem {
  problem_id: string;
  title: {
    language: string;
    title: string;
  }[];
  status: string;
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
  comments?: string[];
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
  status: string;
  created_at: string;
  updated_at: string;
  originalProblem: Problem | PublishedProblem;
}
