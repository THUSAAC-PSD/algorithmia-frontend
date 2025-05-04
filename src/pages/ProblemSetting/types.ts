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

export type ViewType = 'list' | 'detail';
