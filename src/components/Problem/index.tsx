import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockMath, InlineMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import {
  normalizeProblemStatus,
  ProblemStatus,
} from '../../types/problem-status';

interface MarkdownProps {
  children: string;
}

// eslint-disable-next-line
const _mapProps = (props: MarkdownProps): any => ({
  ...props,
  skipHtml: false,
  remarkPlugins: [remarkMath, [remarkGfm, { singleTilde: false }]],
  // rehypeRaw allows rendering of inline HTML (e.g., <br />) present in some problem statements.
  // Note: This can introduce XSS if untrusted content is rendered. Our content comes from trusted editors.
  rehypePlugins: [rehypeRaw, rehypeKatex],
  components: {
    math: ({ children }: { children: React.ReactNode }) => (
      <BlockMath>{String(children)}</BlockMath>
    ),
    inlineMath: ({ children }: { children: React.ReactNode }) => (
      <InlineMath>{String(children)}</InlineMath>
    ),
  },
});

const Markdown: React.FC<MarkdownProps> = (props) => (
  <ReactMarkdown {..._mapProps(props)} />
);

// Decode HTML entities so sequences like &lt;br/&gt; become <br/> before markdown processing.
// This enables inline HTML to be recognized by rehype-raw instead of rendered as plain text.
const decodeEntities = (input: string): string => {
  if (!input) return '';
  if (typeof window === 'undefined') return input; // SSR safeguard
  const ta = document.createElement('textarea');
  ta.innerHTML = input;
  return ta.value;
};
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
  base_problem_id?: string;
  author?: string;
  status?: ProblemStatus;
}

interface ProblemProps {
  problem: IProblem;
  language?: string;
}

const Problem: React.FC<ProblemProps> = ({ problem, language }) => {
  const { t, i18n } = useTranslation();

  const [exampleExist, setExampleExist] = React.useState(false);
  useEffect(() => {
    if (problem.examples.length > 1) {
      setExampleExist(true);
    } else if (problem.examples.length === 1) {
      if (
        problem.examples[0].input !== '' &&
        problem.examples[0].output !== ''
      ) {
        setExampleExist(true);
      }
    }
  }, [problem.examples]);

  // Use i18n's current language if no specific language is provided
  const currentLanguage = language || i18n.language;

  // Get details in the preferred language, or the first available
  const details =
    problem.details.find((d) => d.language === currentLanguage) ||
    problem.details[0];
  const difficulty =
    problem.problem_difficulty.find((d) => d.language === currentLanguage)
      ?.display_name ||
    problem.problem_difficulty[0]?.display_name ||
    'Unknown';

  // Get status badge for rendering
  const getStatusBadge = (status: string | undefined) => {
    const normalized = normalizeProblemStatus(status);

    const statusStyles: Record<ProblemStatus, string> = {
      draft: 'bg-slate-500/20 text-slate-300',
      pending_review: 'bg-yellow-500/20 text-yellow-400',
      needs_revision: 'bg-orange-500/20 text-orange-400',
      pending_testing: 'bg-indigo-500/20 text-indigo-300',
      testing_changes_requested: 'bg-purple-500/20 text-purple-300',
      awaiting_final_check: 'bg-blue-500/20 text-blue-300',
      completed: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };

    const labelKey: Record<ProblemStatus, string> = {
      draft: 'problem.statuses.draft',
      pending_review: 'problem.statuses.pending_review',
      needs_revision: 'problem.statuses.needs_revision',
      pending_testing: 'problem.statuses.pending_testing',
      testing_changes_requested: 'problem.statuses.testing_changes_requested',
      awaiting_final_check: 'problem.statuses.awaiting_final_check',
      completed: 'problem.statuses.completed',
      rejected: 'problem.statuses.rejected',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[normalized]}`}
      >
        {t(labelKey[normalized])}
      </span>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
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
              <span className="text-slate-400 mr-1">
                {t('problem.author')}:
              </span>
              <span className="text-slate-200">{problem.author}</span>
            </div>
          )}

          {problem.status && (
            <div className="flex items-center text-sm">
              <span className="text-slate-400 mr-1">
                {t('problem.status')}:
              </span>
              {getStatusBadge(problem.status)}
            </div>
          )}
        </div>
      </div>

      {details.background && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.background')}
          </h3>
          <div className="markdown-body">
            <Markdown>{decodeEntities(details.background)}</Markdown>
          </div>
        </div>
      )}

      {details.statement && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.statement')}
          </h3>
          <div className="markdown-body">
            <Markdown>{decodeEntities(details.statement)}</Markdown>
          </div>
        </div>
      )}

      {details.input_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.inputFormat')}
          </h3>
          <div className="markdown-body">
            <Markdown>{decodeEntities(details.input_format)}</Markdown>
          </div>
        </div>
      )}

      {details.output_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.outputFormat')}
          </h3>
          <div className="markdown-body">
            <Markdown>{decodeEntities(details.output_format)}</Markdown>
          </div>
        </div>
      )}

      {exampleExist && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.examples')}
          </h3>
          <div className="space-y-4">
            {problem.examples.map((example) => (
              <div key={example.input} className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400 mb-2">
                    {t('problem.input')}:
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">
                    {example.input}
                  </pre>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400 mb-2">
                    {t('problem.output')}:
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
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.notes')}
          </h3>
          <div className="markdown-body">
            <Markdown>{decodeEntities(details.note)}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problem;
