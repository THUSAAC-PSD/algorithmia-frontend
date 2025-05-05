import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownProps {
  children: string;
}

// eslint-disable-next-line
const _mapProps = (props: MarkdownProps): any => ({
  ...props,
  remarkPlugins: [remarkMath, [remarkGfm, { singleTilde: false }]],
  rehypePlugins: [rehypeKatex],
  components: {
    math: ({ value }: { value: string }) => <BlockMath>{value}</BlockMath>,
    inlineMath: ({ value }: { value: string }) => (
      <InlineMath>{value}</InlineMath>
    ),
  },
});

const Markdown: React.FC<MarkdownProps> = (props) => (
  <ReactMarkdown {..._mapProps(props)} />
);
export interface IProblem {
  id: string;
  problem_difficulty: {
    language: string;
    display_name: string;
  }[];
  details: {
    language: string;
    title?: string;
    background?: string;
    statement?: string;
    input_format?: string;
    output_format?: string;
    note: string;
  }[];
  examples: {
    input: string;
    output: string;
  }[];
  is_submitted: boolean;
  target_contest_id?: string;
  comments?: string[];
  created_at: Date;
  updated_at: Date;
  author?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'needs_changes';
}

interface ProblemProps {
  problem: IProblem;
  language?: string;
}

const Problem: React.FC<ProblemProps> = ({ problem, language = 'en' }) => {
  // Get details in the preferred language, or the first available
  const details =
    problem.details.find((d) => d.language === language) || problem.details[0];
  const difficulty =
    problem.problem_difficulty.find((d) => d.language === language)
      ?.display_name ||
    problem.problem_difficulty[0]?.display_name ||
    'Unknown';

  // Get status badge for rendering
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Rejected
          </span>
        );
      case 'needs_changes':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            Needs Changes
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{details.title}</h1>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium">
            {difficulty}
          </span>
        </div>

        <div className="text-xs text-slate-400 mt-2">
          ID: {problem.id} • Created: {problem.created_at.toLocaleDateString()}
        </div>

        <div className="flex flex-wrap items-center mt-3 gap-3">
          {problem.author && (
            <div className="flex items-center text-sm">
              <span className="text-slate-400 mr-1">Author:</span>
              <span className="text-slate-200">{problem.author}</span>
            </div>
          )}

          {problem.status && (
            <div className="flex items-center text-sm">
              <span className="text-slate-400 mr-1">Status:</span>
              {getStatusBadge(problem.status)}
            </div>
          )}
        </div>
      </div>

      {details.background && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Background</h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            <Markdown>{details.background}</Markdown>
          </div>
        </div>
      )}

      {details.statement && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Problem Statement
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            <Markdown>{details.statement}</Markdown>
          </div>
        </div>
      )}

      {details.input_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Input Format
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            <Markdown>{details.input_format}</Markdown>
          </div>
        </div>
      )}

      {details.output_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Output Format
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            <Markdown>{details.output_format}</Markdown>
          </div>
        </div>
      )}

      {problem.examples && problem.examples.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Examples</h3>
          <div className="space-y-4">
            {problem.examples.map((example) => (
              <div key={example.input} className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400 mb-2">
                    Input:
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">
                    {example.input}
                  </pre>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400 mb-2">
                    Output:
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">
                    {example.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {details.note && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.note}
          </div>
        </div>
      )}
    </div>
  );
};

export default Problem;
