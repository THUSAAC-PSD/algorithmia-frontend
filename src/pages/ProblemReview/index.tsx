import { ArrowsUpDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config';
import {
  normalizeProblemStatus,
  ProblemStatus,
  REVIEW_STATUS_ORDER,
} from '../../types/problem-status';

const REVIEWABLE_STATUSES: ReadonlyArray<ProblemStatus> =
  REVIEW_STATUS_ORDER.filter((status) => status !== 'draft');

const getCanonicalProblemId = (problem: IProblem): string =>
  problem.base_problem_id ?? problem.id;

const dedupeByCanonicalId = (items: IProblem[]): IProblem[] =>
  Array.from(
    items
      .reduce((map, problem) => {
        const key = getCanonicalProblemId(problem);
        const existing = map.get(key);

        if (!existing) {
          map.set(key, problem);
          return map;
        }

        if (problem.updated_at.getTime() > existing.updated_at.getTime()) {
          map.set(key, problem);
        }

        return map;
      }, new Map<string, IProblem>())
      .values(),
  );

const ProblemReview = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ProblemStatus>(
    'all',
  );
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    let isMounted = true;

    const fetchProblems = async () => {
      setLoading(true);
      try {
        // Fetch problems from the API
        const response = await fetch(`${API_BASE_URL}/problems`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message ||
              'Failed to load problems for review',
          );
        }

        const data = await response.json();

        if (isMounted) {
          // Transform published problems
          const transformedProblems: IProblem[] = Array.isArray(data?.problems)
            ? data.problems.map(
                (problem: {
                  problem_id: string;
                  title: Array<{ language: string; title: string }>;
                  status: string;
                  creator?: { user_id: string; username: string };
                  reviewer?: { user_id: string; username: string };
                  testers?: Array<{ user_id: string; username: string }>;
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
                }) => {
                  // Extract title from the array of language-title objects
                  const titleObj =
                    Array.isArray(problem.title) && problem.title.length > 0
                      ? problem.title.find((t) => t.language === 'en-US') ||
                        problem.title[0]
                      : { language: 'en-US', title: 'Untitled Problem' };

                  // Determine canonical/problem base identifier to deduplicate history entries
                  const candidateIds = [
                    (problem as { history_root_id?: string }).history_root_id,
                    (problem as { root_problem_id?: string }).root_problem_id,
                    (problem as { base_problem_id?: string }).base_problem_id,
                    (problem as { origin_problem_id?: string })
                      .origin_problem_id,
                    (problem as { source_problem_id?: string })
                      .source_problem_id,
                  ];
                  const baseProblemId =
                    candidateIds.find(
                      (value) =>
                        typeof value === 'string' && value.trim().length > 0,
                    ) || problem.problem_id;

                  // Transform problem_difficulty to match IProblem format
                  const difficultyDisplayNames =
                    problem.problem_difficulty?.display_names || [];
                  const mappedDifficulty = difficultyDisplayNames.map((d) => ({
                    language: d.language,
                    display_name: d.display_name,
                  }));

                  return {
                    id: problem.problem_id,
                    base_problem_id: baseProblemId,
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
                    status: normalizeProblemStatus(problem.status),
                  };
                },
              )
            : [];
          const normalizedProblems = transformedProblems.filter((problem) =>
            REVIEWABLE_STATUSES.includes(
              normalizeProblemStatus(problem.status),
            ),
          );
          const uniqueProblems = dedupeByCanonicalId(normalizedProblems);

          setProblems(uniqueProblems);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        if (isMounted) {
          // Fallback to mock data
          const mockProblems: IProblem[] = [];
          setProblems(mockProblems);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort problems
  const filteredAndSortedProblems = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    const filtered = problems.filter((problem) => {
      const title = problem.details[0]?.title || '';
      const author = problem.author || '';
      const status = problem.status ?? 'pending_review';
      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        author.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
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

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  // Get status badge
  const getStatusBadge = (status: string | undefined) => {
    const normalizedStatus = normalizeProblemStatus(status);
    const statusStyles: Record<ProblemStatus, string> = {
      draft: 'bg-slate-500/20 text-slate-300',
      pending_review: 'bg-yellow-500/20 text-yellow-400',
      review_changes_requested: 'bg-orange-500/20 text-orange-400',
      pending_testing: 'bg-indigo-500/20 text-indigo-300',
      testing_changes_requested: 'bg-purple-500/20 text-purple-300',
      awaiting_final_check: 'bg-blue-500/20 text-blue-300',
      completed: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[normalizedStatus]}`}
      >
        {t(`problem.statuses.${normalizedStatus}`)}
      </span>
    );
  };

  // Navigate to problem detail page
  const handleProblemClick = (problemId: string) => {
    navigate(`/problemreview/${problemId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-medium text-white">
          {t('problemReview.title')}
        </h2>
        <div className="flex space-x-4">
          <button
            onClick={toggleSortOrder}
            className="flex items-center px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none hover:bg-slate-600 transition-colors"
            title={t('problemReview.sortBy', {
              order:
                sortOrder === 'newest'
                  ? t('problemReview.oldest')
                  : t('problemReview.newest'),
            })}
            type="button"
          >
            <ArrowsUpDownIcon className="w-5 h-5 mr-2" />
            {sortOrder === 'newest'
              ? t('problemReview.newestFirst')
              : t('problemReview.oldestFirst')}
          </button>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                (e.target.value as ProblemStatus | 'all') ?? 'all',
              )
            }
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('problemReview.allStatus')}</option>
            {REVIEWABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`problem.statuses.${status}`)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t('problemReview.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredAndSortedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-xl">{t('problemReview.noProblemsFound')}</p>
            <p className="mt-2">{t('problemReview.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => handleProblemClick(problem.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-white">
                          {problem.details[0]?.title ||
                            t('problemReview.untitledProblem')}
                        </h3>
                        <span className="ml-3">
                          {getStatusBadge(problem.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-400 flex items-center space-x-4">
                        <span>
                          {t('problemReview.author')}:{' '}
                          {problem.author || t('problemReview.unknown')}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1 inline" />
                          {t('problemReview.submittedOn')}{' '}
                          {problem.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                      {problem.problem_difficulty[0]?.display_name ||
                        t('problemReview.unknown')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemReview;
