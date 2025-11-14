import 'katex/dist/katex.min.css';

import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { API_BASE_URL } from '../../config';
import {
  normalizeProblemStatus,
  ProblemStatus,
} from '../../types/problem-status';
import { Problem, PublishedProblem } from './types';

interface ProblemReadOnlyViewProps {
  problem: Problem | PublishedProblem;
  problemType: 'draft' | 'published';
  onBack: () => void;
  onEdit?: () => void;
}

interface ChatMessage {
  message_type: string;
  payload: {
    message_id?: string;
    sender?: { user_id: string; username: string };
    content?: string;
    reviewer?: { user_id: string; username: string };
    decision?: string;
    tester?: { user_id: string; username: string };
    status?: string;
    completer?: { user_id: string; username: string };
    submitter?: { user_id: string; username: string };
    changed_fields?: string[];
    diffs?: Record<string, { before: string; after: string }>;
  };
  timestamp: string;
}

interface DisplayName {
  language: string;
  display_name: string;
}

interface ProblemDifficulty {
  problem_difficulty_id: string;
  display_names: DisplayName[];
  color?: string;
}

interface StatusBadgeProps {
  status: ProblemStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig: Record<
    ProblemStatus,
    { label: string; color: string; icon: React.ReactElement }
  > = {
    draft: {
      label: 'Draft',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      icon: <ClockIcon className="w-4 h-4" />,
    },
    pending_review: {
      label: 'Pending Review',
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <ClockIcon className="w-4 h-4" />,
    },
    needs_revision: {
      label: 'Needs Revision',
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      icon: <ExclamationCircleIcon className="w-4 h-4" />,
    },
    pending_testing: {
      label: 'Pending Testing',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <ClockIcon className="w-4 h-4" />,
    },
    testing_changes_requested: {
      label: 'Changes Requested (Testing)',
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      icon: <ExclamationCircleIcon className="w-4 h-4" />,
    },
    awaiting_final_check: {
      label: 'Awaiting Final Check',
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      icon: <ClockIcon className="w-4 h-4" />,
    },
    completed: {
      label: 'Completed',
      color:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircleIcon className="w-4 h-4" />,
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <XCircleIcon className="w-4 h-4" />,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

const ProblemReadOnlyView = ({
  problem,
  problemType,
  onBack,
  onEdit,
}: ProblemReadOnlyViewProps) => {
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Extract problem details based on type
  const problemDetails =
    problemType === 'draft'
      ? (problem as Problem).details
      : (problem as PublishedProblem).details || null;

  const examples =
    problemType === 'draft'
      ? (problem as Problem).examples
      : (problem as PublishedProblem).examples || [];

  const rawStatus =
    problemType === 'draft'
      ? (problem as Problem).status || 'draft'
      : (problem as PublishedProblem).status;
  const status = normalizeProblemStatus(rawStatus);

  const difficultyId =
    problemType === 'draft'
      ? (problem as Problem).problem_difficulty_id
      : (problem as PublishedProblem).problem_difficulty?.problem_difficulty_id;

  // Build activity log from chat messages
  const activityLog = chatMessages
    .filter((msg) => msg.message_type !== 'user') // Filter out regular user messages
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  console.log('Chat messages state:', chatMessages);
  console.log('Activity log after filtering:', activityLog);
  console.log('Activity log length:', activityLog.length);

  useEffect(() => {
    if (difficultyId) {
      fetch(`${API_BASE_URL}/problem-difficulties`, {
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          const found = data.problem_difficulties?.find(
            (d: ProblemDifficulty) => d.problem_difficulty_id === difficultyId,
          );
          if (found) {
            setDifficulty(found);
          }
        })
        .catch((err) => {
          console.error('Error fetching difficulty:', err);
        });
    }
  }, [difficultyId]);

  // Fetch chat messages for activity log
  useEffect(() => {
    // For both draft and published problems, try to get the actual problem ID
    // Published problems have their ID in 'problem_id' or we need to extract it
    let problemId: string | undefined;

    if (problemType === 'published') {
      // For published problems, the ID might be in different places
      const pub = problem as PublishedProblem;
      problemId =
        pub.problem_id ||
        (pub as { submitted_problem_id?: string }).submitted_problem_id;
    } else {
      // For drafts, use submitted_problem_id if it exists (means it's been submitted)
      problemId = (problem as Problem).submitted_problem_id;
    }

    console.log('Fetching activity logs for problem:', problemId);
    console.log('Problem type:', problemType);
    console.log('Problem object:', problem);

    if (problemId) {
      fetch(`${API_BASE_URL}/problems/${problemId}/messages`, {
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      })
        .then((res) => {
          console.log('Response status:', res.status);
          return res.json();
        })
        .then((data) => {
          console.log('Full API response:', data);
          console.log('Activity log messages:', data.messages);
          console.log('Messages array length:', data.messages?.length);
          if (data.messages) {
            setChatMessages(data.messages);
          } else {
            console.warn('No messages property in response');
          }
        })
        .catch((err) => {
          console.error('Error fetching chat messages:', err);
        });
    } else {
      console.warn('No problem ID found, cannot fetch activity logs');
    }
  }, [problem, problemType]);

  const difficultyName = difficulty?.display_names.find(
    (d) => d.language === 'en-US',
  )?.display_name;

  const difficultyColor = difficulty?.color || '#6366f1';

  return (
    <div className="min-h-screen bg-slate-900 p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white mb-4 transition-all duration-200 border border-slate-700 hover:border-slate-600"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to List
          </button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                {problemDetails?.title || 'Untitled Problem'}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={status} />
                {difficultyName && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: `${difficultyColor}20`,
                      color: difficultyColor,
                      border: `1px solid ${difficultyColor}40`,
                    }}
                  >
                    {difficultyName}
                  </span>
                )}
              </div>
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                type="button"
              >
                Edit Problem
              </button>
            )}
          </div>
        </div>

        {/* Problem Content */}
        <div className="space-y-6 mb-8">
          {/* Background */}
          {problemDetails?.background && (
            <div>
              <h2 className="text-lg font-bold text-indigo-300 mb-3">
                Background
              </h2>
              <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300 prose-code:text-pink-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                  {problemDetails.background}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Statement */}
          {problemDetails?.statement && (
            <div>
              <h2 className="text-lg font-bold text-emerald-300 mb-3">
                Problem Statement
              </h2>
              <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300 prose-code:text-pink-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                  {problemDetails.statement}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Input Format */}
          {problemDetails?.input_format && (
            <div>
              <h2 className="text-lg font-bold text-blue-300 mb-3">
                Input Format
              </h2>
              <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300 prose-code:text-pink-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                  {problemDetails.input_format}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Output Format */}
          {problemDetails?.output_format && (
            <div>
              <h2 className="text-lg font-bold text-purple-300 mb-3">
                Output Format
              </h2>
              <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300 prose-code:text-pink-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                  {problemDetails.output_format}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Examples */}
          <div>
            <h2 className="text-lg font-bold text-cyan-300 mb-3">Examples</h2>
            {examples &&
            examples.length > 0 &&
            examples.some((ex) => ex.input?.trim() || ex.output?.trim()) ? (
              <div className="space-y-3">
                {examples.map((example, index) => (
                  <div
                    key={`example-${example.input?.substring(0, 20)}-${example.output?.substring(0, 20)}-${index}`}
                    className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30"
                  >
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700">
                      <span className="font-semibold text-sm text-cyan-300">
                        Example {index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                      <div className="p-4">
                        <div className="text-xs font-semibold text-emerald-400 uppercase mb-2">
                          INPUT
                        </div>
                        <pre className="bg-slate-950 text-emerald-100 p-3 rounded text-xs overflow-x-auto border border-slate-800 font-mono">
                          <code>{example.input}</code>
                        </pre>
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-semibold text-cyan-400 uppercase mb-2">
                          OUTPUT
                        </div>
                        <pre className="bg-slate-950 text-cyan-100 p-3 rounded text-xs overflow-x-auto border border-slate-800 font-mono">
                          <code>{example.output}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">
                  No input/output examples provided yet.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {problemDetails?.note && (
            <div>
              <h2 className="text-lg font-bold text-yellow-300 mb-3">Notes</h2>
              <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300 prose-code:text-pink-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                  {problemDetails.note}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3">Activity Log</h2>
          {activityLog.length > 0 ? (
            <div className="space-y-3">
              {activityLog.map((message, index) => {
                const isReviewed = message.message_type === 'reviewed';
                const isTested = message.message_type === 'tested';
                const isCompleted = message.message_type === 'completed';
                const isSubmitted = message.message_type === 'submitted';
                const isEdited = message.message_type === 'edited';

                return (
                  <div
                    key={
                      message.payload.message_id ||
                      `${message.message_type}-${message.timestamp}-${index}`
                    }
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {isSubmitted && (
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-blue-400" />
                          </div>
                        )}
                        {isEdited && (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                        {isReviewed && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.payload.decision === 'approve'
                                ? 'bg-green-500/20'
                                : 'bg-orange-500/20'
                            }`}
                          >
                            {message.payload.decision === 'approve' ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-400" />
                            ) : (
                              <ExclamationCircleIcon className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                        )}
                        {isTested && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.payload.status === 'pass'
                                ? 'bg-green-500/20'
                                : message.payload.status === 'fail'
                                  ? 'bg-red-500/20'
                                  : 'bg-gray-500/20'
                            }`}
                          >
                            {message.payload.status === 'pass' ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-400" />
                            ) : message.payload.status === 'fail' ? (
                              <XCircleIcon className="w-4 h-4 text-red-400" />
                            ) : (
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                        {isCompleted && (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-white text-sm">
                            {isSubmitted &&
                              `${message.payload.submitter?.username || 'User'} submitted the problem`}
                            {isEdited &&
                              `${message.payload.submitter?.username || 'User'} updated the problem`}
                            {isReviewed &&
                              `${message.payload.reviewer?.username || 'Reviewer'} ${message.payload.decision === 'approve' ? 'approved' : 'requested changes'}`}
                            {isTested &&
                              `${message.payload.tester?.username || 'Tester'} marked as ${message.payload.status?.toUpperCase()}`}
                            {isCompleted &&
                              `${message.payload.completer?.username || 'User'} marked as completed`}
                          </div>
                          {isEdited &&
                            Array.isArray(message.payload.changed_fields) &&
                            message.payload.changed_fields.length > 0 && (
                              <div className="mt-1 text-xs text-gray-300">
                                <span className="text-gray-400">Changed: </span>
                                <span className="inline-flex flex-wrap gap-1 align-middle">
                                  {message.payload.changed_fields.map(
                                    (f, i) => (
                                      <span
                                        key={f || i}
                                        className="px-2 py-0.5 rounded bg-slate-700/70 border border-slate-600 text-gray-200"
                                      >
                                        {f.replace('_', ' ')}
                                      </span>
                                    ),
                                  )}
                                </span>
                              </div>
                            )}
                          <div className="text-xs text-gray-400 whitespace-nowrap">
                            {format(
                              new Date(message.timestamp),
                              'MMM dd, h:mm a',
                            )}
                          </div>
                        </div>
                        {/* Collapsible diffs when available */}
                        {isEdited && message.payload.diffs && (
                          <details className="mt-2">
                            <summary className="text-xs text-indigo-300 cursor-pointer hover:text-indigo-200">
                              View changes
                            </summary>
                            <div className="mt-2 space-y-3">
                              {Object.entries(message.payload.diffs).map(
                                ([field, diff]) => (
                                  <div
                                    key={field}
                                    className="border border-slate-700 rounded p-3 bg-slate-900/40"
                                  >
                                    <div className="text-xs font-semibold text-gray-200 mb-2 uppercase tracking-wide">
                                      {field.replace('_', ' ')}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-[10px] text-gray-400 mb-1">
                                          Before
                                        </div>
                                        <pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2 text-gray-300 overflow-x-auto">
                                          <code>{diff.before || '—'}</code>
                                        </pre>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-gray-400 mb-1">
                                          After
                                        </div>
                                        <pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2 text-gray-300 overflow-x-auto">
                                          <code>{diff.after || '—'}</code>
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-6 text-center">
              <ClockIcon className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                No activity logs yet. Activities will appear here when the
                problem is reviewed or tested.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemReadOnlyView;
