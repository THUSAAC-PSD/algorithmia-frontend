export interface Problem {
  id: string;
  timestamp: string;
  content: ProblemContent;
}

export interface ProblemContent {
  title: string;
  background: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  samples: SampleData[];
  attachedFile?: FileReference;
}

export interface SampleData {
  input: string;
  output: string;
}

export interface FileReference {
  fileId: string;
  fileName: string;
  fileSize: number;
}

export type ViewType = 'list' | 'detail';
