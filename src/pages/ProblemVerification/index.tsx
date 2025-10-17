import {
  ArrowsUpDownIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config';

interface ProblemApiResponse {
  problem_id: string;
  title: Array<{
    language: string;
    title: string;
  }>;
  status: string;
  creator?: {
    user_id: string;
    username: string;
  };
  reviewer?: {
    user_id: string;
    username: string;
  };
  testers?: Array<{
    user_id: string;
    username: string;
  }>;
  target_contest: null | unknown;
  assigned_contest: null | unknown;
  problem_difficulty: {
    problem_difficulty_id: string;
    display_names: Array<{
      language: string;
      display_name: string;
    }>;
  };
  created_at: string;
  updated_at: string;
  author?: string;
}

const ProblemVerification = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [problems, setProblems] = useState<IProblem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Map backend statuses to UI statuses used by filters/badges
  const mapStatus = (status?: string): IProblem['status'] => {
    switch (status) {
      case 'pending_review':
        return 'pending';
      case 'approved_for_testing':
      case 'awaiting_final_check':
      case 'completed':
      case 'approve':
        return 'approved';
      case 'needs_revision':
        return 'needs_changes';
      case 'rejected':
      case 'reject':
        return 'rejected';
      default:
        return (status as IProblem['status']) || 'pending';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProblems = async () => {
      setIsLoading(true);
      try {
        // Fetch submitted problems from the /problems endpoint
        const response = await fetch(`${API_BASE_URL}/problems`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message ||
              'Failed to load problems for verification',
          );
        }

        const data = await response.json();

        if (isMounted) {
          // Transform published problems
          const transformedProblems = Array.isArray(data?.problems)
            ? data.problems.map((problem: ProblemApiResponse) => {
                // Extract title from the array of language-title objects
                const titleObj =
                  Array.isArray(problem.title) && problem.title.length > 0
                    ? problem.title.find((t) => t.language === 'en-US') ||
                      problem.title[0]
                    : { language: 'en-US', title: 'Untitled Problem' };

                // Transform problem_difficulty to match IProblem format
                const difficultyDisplayNames =
                  problem.problem_difficulty?.display_names || [];
                const mappedDifficulty = difficultyDisplayNames.map((d) => ({
                  language: d.language,
                  display_name: d.display_name,
                }));

                return {
                  id: problem.problem_id,
                  problem_difficulty:
                    mappedDifficulty.length > 0
                      ? mappedDifficulty
                      : [{ language: 'en-US', display_name: 'Unknown' }],
                  details: [
                    {
                      // Create placeholder details with just the title
                      language: titleObj.language,
                      title: titleObj.title,
                      background: '',
                      statement: '',
                      input_format: '',
                      output_format: '',
                      note: '',
                    },
                  ],
                  examples: [],
                  is_submitted: true,
                  created_at: new Date(problem.created_at || Date.now()),
                  updated_at: new Date(problem.updated_at || Date.now()),
                  author: problem.creator?.username || 'Unknown',
                  status: mapStatus(problem.status),
                };
              })
            : [];
          console.log('Fetched problems:', transformedProblems);
          setProblems(transformedProblems);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to load problems',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback data for development if no problems are loaded
  useEffect(() => {
    if (!isLoading && problems.length === 0) {
      console.warn('No problems found from API, using fallback data');
      setProblems([]);
    }
  }, [isLoading, problems.length]);

  const filteredAndSortedProblems = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    const filtered = problems.filter((problem) => {
      const title = problem.details[0]?.title || '';
      const author = problem.author || '';
      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        author.toLowerCase().includes(searchLower);
      const matchesStatus =
        filterStatus === 'all' || problem.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    const toTimestamp = (value: unknown) => {
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return [...filtered].sort((a, b) => {
      const dateA = toTimestamp(a.created_at);
      const dateB = toTimestamp(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [problems, searchTerm, filterStatus, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  const handleStatusChange = async (
    problemId: string,
    newStatus: IProblem['status'],
  ) => {
    try {
      // Send status change to server
      const response = await fetch(
        `${API_BASE_URL}/problems/${problemId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || 'Failed to update problem status',
        );
      }

      // Update local state
      setProblems(
        problems.map((problem) =>
          problem.id === problemId
            ? { ...problem, status: newStatus }
            : problem,
        ),
      );

      toast.success(t('problemVerification.statusUpdated'));
    } catch (error) {
      console.error('Error updating problem status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status',
      );
    }
  };

  const getStatusBadge = (status: IProblem['status']) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {t('problemVerification.statuses.pending')}
          </span>
        );
      case 'approve':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            {t('problemVerification.statuses.approved')}
          </span>
        );
      case 'reject':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            {t('problemVerification.statuses.rejected')}
          </span>
        );
      case 'needs_revision':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            {t('problemVerification.statuses.needsChanges')}
          </span>
        );
      default:
        return null;
    }
  };

  const [feedbackText, setFeedbackText] = useState<string>('');

  const submitFeedback = async () => {
    if (!activeTabId) return;

    setIsSubmitting(true);
    try {
      // Send feedback to server
      const response = await fetch(
        `${API_BASE_URL}/problems/${activeTabId}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({
            feedback: feedbackText,
            status: 'needs_changes',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || 'Failed to submit feedback',
        );
      }

      // Update local state
      await handleStatusChange(activeTabId, 'needs_revision');

      toast.success(t('problemVerification.feedbackSubmitted'));
      setFeedbackText('');
      setActiveTabId(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit feedback',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChatRedirect = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${problemId}`);
  };

  const handleProblemClick = (problemId: string) => {
    // Navigate to the problem verification detail page
    navigate(`/problemverification/${problemId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-medium text-white">
          {t('problemVerification.title')}
        </h2>
        <div className="flex space-x-4">
          <button
            onClick={toggleSortOrder}
            className="flex items-center px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none hover:bg-slate-600 transition-colors"
            title={t('problemVerification.sortBy', {
              order:
                sortOrder === 'newest'
                  ? t('problemVerification.oldest')
                  : t('problemVerification.newest'),
            })}
            type="button"
          >
            <ArrowsUpDownIcon className="w-5 h-5 mr-2" />
            {sortOrder === 'newest'
              ? t('problemVerification.newestFirst')
              : t('problemVerification.oldestFirst')}
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('problemVerification.allStatus')}</option>
            <option value="pending">
              {t('problemVerification.statuses.pending')}
            </option>
            <option value="approved">
              {t('problemVerification.statuses.approved')}
            </option>
            <option value="rejected">
              {t('problemVerification.statuses.rejected')}
            </option>
            <option value="needs_changes">
              {t('problemVerification.statuses.needsChanges')}
            </option>
          </select>
          <input
            type="text"
            placeholder={t('problemVerification.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-xl">{t('common.loading')}</p>
          </div>
        ) : filteredAndSortedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-xl">
              {t('problemVerification.noProblemsFound')}
            </p>
            <p className="mt-2">
              {t('problemVerification.tryAdjustingFilters')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
                onClick={() => handleProblemClick(problem.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-white">
                          {problem.details[0]?.title ||
                            t('problemVerification.untitledProblem')}
                        </h3>
                        <span className="ml-3">
                          {getStatusBadge(problem.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-400 flex items-center space-x-4">
                        <span>
                          {t('problemVerification.author')}:{' '}
                          {problem.author || t('problemVerification.unknown')}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1 inline" />
                          {t('problemVerification.submittedOn')}{' '}
                          {problem.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleChatRedirect(problem.id, e)}
                        className="p-2 rounded-full hover:bg-indigo-500/10 text-indigo-400"
                        title={t('problemVerification.openChat')}
                        type="button"
                      >
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {activeTabId === problem.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        {t('problemVerification.problemDescription')}
                      </h4>
                      <div className="bg-slate-900 p-4 rounded-lg text-slate-300">
                        {problem.details[0]?.statement ||
                          t('problemVerification.noDescriptionProvided')}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        {t('problemVerification.feedback')}
                      </h4>
                      <textarea
                        placeholder={t(
                          'problemVerification.feedbackPlaceholder',
                        )}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={4}
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        type="button"
                        onClick={() => setActiveTabId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        type="button"
                        disabled={!feedbackText.trim() || isSubmitting}
                        onClick={submitFeedback}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {t('common.submitting')}
                          </div>
                        ) : (
                          t('problemVerification.submitFeedback')
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemVerification;
