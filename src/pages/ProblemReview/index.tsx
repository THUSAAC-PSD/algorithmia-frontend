import { ArrowsUpDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config';

const REVIEWABLE_STATUSES: ReadonlyArray<IProblem['status']> = [
  'pending',
  'approved',
  'rejected',
  'needs_changes',
];

const dedupeById = (items: IProblem[]): IProblem[] =>
  Array.from(
    items
      .reduce((map, problem) => {
        if (!map.has(problem.id)) {
          map.set(problem.id, problem);
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
  const [filterStatus, setFilterStatus] = useState<'all' | IProblem['status']>(
    'all',
  );
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Map backend statuses to UI statuses used by filters/badges
  const mapStatus = useCallback((status?: string): IProblem['status'] => {
    switch (status) {
      case 'pending_review':
        return 'pending';
      case 'approved_for_testing':
      case 'awaiting_final_check':
      case 'completed':
        return 'approved';
      case 'needs_revision':
        return 'needs_changes';
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'needs_changes':
      case 'approved':
      case 'rejected':
      case 'pending':
        return status;
      default:
        return (status as IProblem['status']) || 'pending';
    }
  }, []);

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
                },
              )
            : [];
          const normalizedProblems = transformedProblems.filter((problem) =>
            REVIEWABLE_STATUSES.includes(problem.status || 'pending'),
          );
          const uniqueProblems = dedupeById(normalizedProblems);

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
  }, [mapStatus]);

  // Filter and sort problems
  const filteredAndSortedProblems = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    const filtered = problems.filter((problem) => {
      const title = problem.details[0]?.title || '';
      const author = problem.author || '';
      const status = problem.status || 'pending';
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
    const normalizedStatus = mapStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {t('problemReview.statuses.pending')}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            {t('problemReview.statuses.approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            {t('problemReview.statuses.rejected')}
          </span>
        );
      case 'needs_changes':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            {t('problemReview.statuses.needsChanges')}
          </span>
        );
      default:
        return null;
    }
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
              setFilterStatus(e.target.value as 'all' | IProblem['status'])
            }
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('problemReview.allStatus')}</option>
            <option value="pending">
              {t('problemReview.statuses.pending')}
            </option>
            <option value="approved">
              {t('problemReview.statuses.approved')}
            </option>
            <option value="rejected">
              {t('problemReview.statuses.rejected')}
            </option>
            <option value="needs_changes">
              {t('problemReview.statuses.needsChanges')}
            </option>
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
