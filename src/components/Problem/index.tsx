import React from 'react';
import { useTranslation } from 'react-i18next';

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

const Problem: React.FC<ProblemProps> = ({ problem, language }) => {
  const { t, i18n } = useTranslation();

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
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {t('problem.statuses.pending')}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            {t('problem.statuses.approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            {t('problem.statuses.rejected')}
          </span>
        );
      case 'needs_changes':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            {t('problem.statuses.needs_changes')}
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
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.background}
          </div>
        </div>
      )}

      {details.statement && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.statement')}
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.statement}
          </div>
        </div>
      )}

      {details.input_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.inputFormat')}
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.input_format}
          </div>
        </div>
      )}

      {details.output_format && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('problem.outputFormat')}
          </h3>
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.output_format}
          </div>
        </div>
      )}

      {problem.examples && problem.examples.length > 0 && (
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
          <div className="text-slate-300 prose prose-invert max-w-none">
            {details.note}
          </div>
        </div>
      )}
    </div>
  );
};

export default Problem;
