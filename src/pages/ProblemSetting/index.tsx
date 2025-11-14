import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../config'; // added
import {
  normalizeProblemStatus,
  ProblemStatus,
} from '../../types/problem-status';
import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';
import ProblemReadOnlyView from './ProblemReadOnlyView';
import {
  CombinedProblemListItem,
  Problem,
  ProblemExample,
  ProblemType,
  PublishedProblem,
  SaveProblemPayload,
  ViewType,
} from './types';

interface DraftApiProblem {
  problem_draft_id: string;
  submitted_problem_id?: string;
  details: Array<Problem['details']>;
  examples: ProblemExample[];
  problem_difficulty: {
    problem_difficulty_id: string;
  } | null;
  target_contest_id?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

const pickPrimaryDetail = (
  details: Array<Problem['details']> | undefined,
): Problem['details'] => {
  if (Array.isArray(details) && details.length > 0) {
    return details.find((detail) => detail.language === 'en-US') || details[0];
  }

  return {
    language: 'en-US',
    title: '',
    background: '',
    statement: '',
    input_format: '',
    output_format: '',
    note: '',
  };
};

const mapDraftToProblem = (draft: DraftApiProblem): Problem => {
  return {
    problem_draft_id: draft.problem_draft_id,
    submitted_problem_id: draft.submitted_problem_id,
    details: pickPrimaryDetail(draft.details),
    examples: Array.isArray(draft.examples) ? draft.examples : [],
    problem_difficulty_id:
      draft.problem_difficulty?.problem_difficulty_id || '',
    is_submitted: Boolean(draft.submitted_problem_id),
    target_contest_id: draft.target_contest_id || '',
    comments: [],
    created_at: draft.created_at,
    updated_at: draft.updated_at,
    status: normalizeProblemStatus(draft.status),
  };
};

const ProblemSetting = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentProblemType, setCurrentProblemType] =
    useState<ProblemType>('draft');
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('edit');
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'submissions'>(
    'all',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<
    keyof CombinedProblemListItem | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // By default show only the current user's problems. Super admins should see all.
  let showMyProblemsOnly = true;
  try {
    const rolesString = localStorage.getItem('userRoles');
    const roles: string[] = rolesString ? JSON.parse(rolesString) : [];
    if (Array.isArray(roles) && roles.includes('super_admin')) {
      showMyProblemsOnly = false;
    }
  } catch {
    // If parsing fails, fall back to showing only user's problems
    showMyProblemsOnly = true;
  }

  // State for separate problem types
  const [problemDrafts, setProblemDrafts] = useState<Problem[]>([]);
  const [publishedProblems, setPublishedProblems] = useState<
    PublishedProblem[]
  >([]);

  const combinedProblems = useMemo(() => {
    const publishedIds = new Set(
      publishedProblems.map((problem) => problem.problem_id),
    );

    const resolveBaseProblemId = (
      source: unknown,
      fallback: string,
    ): string => {
      if (!source || typeof source !== 'object') {
        return fallback;
      }

      const record = source as Record<string, unknown>;
      const candidates = [
        record.history_root_id,
        record.root_problem_id,
        record.base_problem_id,
        record.origin_problem_id,
        record.source_problem_id,
        record.parent_problem_id,
      ];

      const match = candidates.find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );

      return (match as string | undefined) ?? fallback;
    };

    const draftItems: CombinedProblemListItem[] = problemDrafts
      .filter((draft) => !publishedIds.has(draft.problem_draft_id))
      .map((draft) => {
        const derivedStatus = normalizeProblemStatus(
          draft.status ?? (draft.is_submitted ? 'pending_review' : 'draft'),
        );

        return {
          id: draft.problem_draft_id,
          draft_id: draft.problem_draft_id,
          type: 'draft' as ProblemType,
          title: draft.details?.title || '',
          status: derivedStatus,
          created_at: draft.created_at,
          updated_at: draft.updated_at,
          base_problem_id: resolveBaseProblemId(draft, draft.problem_draft_id),
          originalProblem: draft,
        };
      });

    const publishedItems: CombinedProblemListItem[] = publishedProblems.map(
      (pub) => {
        const titleFromDetails =
          pub.details?.title ||
          (Array.isArray(pub.title) && pub.title.length > 0
            ? (
                pub.title.find(
                  (t: { language: string; title: string }) =>
                    t.language === 'en-US',
                ) || pub.title[0]
              ).title
            : '');

        return {
          id: pub.problem_id,
          draft_id:
            (pub as PublishedProblem).problem_draft_id ?? pub.problem_id,
          type: 'published' as ProblemType,
          title: titleFromDetails,
          status: normalizeProblemStatus(pub.status),
          created_at: pub.created_at,
          updated_at: pub.updated_at,
          base_problem_id: resolveBaseProblemId(pub, pub.problem_id),
          originalProblem: pub,
        };
      },
    );

    const merged = [...draftItems, ...publishedItems];

    const toTimestamp = (value?: string) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const pickPreferred = (
      current: CombinedProblemListItem,
      candidate: CombinedProblemListItem,
    ): CombinedProblemListItem => {
      const currentTime = Math.max(
        toTimestamp(current.updated_at),
        toTimestamp(current.created_at),
      );
      const candidateTime = Math.max(
        toTimestamp(candidate.updated_at),
        toTimestamp(candidate.created_at),
      );

      if (candidateTime > currentTime) {
        return candidate;
      }

      if (candidateTime < currentTime) {
        return current;
      }

      const promoteStatuses = new Set<ProblemStatus>([
        'draft',
        'needs_revision',
        'testing_changes_requested',
      ]);
      const currentStatus = current.status;
      const candidateStatus = candidate.status;

      if (
        promoteStatuses.has(candidateStatus) &&
        !promoteStatuses.has(currentStatus)
      ) {
        return candidate;
      }

      if (
        promoteStatuses.has(currentStatus) &&
        !promoteStatuses.has(candidateStatus)
      ) {
        return current;
      }

      if (candidate.type === 'draft' && current.type !== 'draft') {
        return candidate;
      }

      if (current.type === 'draft' && candidate.type !== 'draft') {
        return current;
      }

      return current;
    };

    const deduped = merged.reduce((acc, item) => {
      const key =
        item.base_problem_id ||
        resolveBaseProblemId(item.originalProblem, item.id);
      const existing = acc.get(key);

      if (!existing) {
        acc.set(key, item);
        return acc;
      }

      acc.set(key, pickPreferred(existing, item));
      return acc;
    }, new Map<string, CombinedProblemListItem>());

    return Array.from(deduped.values());
  }, [problemDrafts, publishedProblems]);

  interface ApiVersion {
    version_id?: string;
    details?: Array<Problem['details']>;
    examples?: ProblemExample[];
    problem_difficulty?: { problem_difficulty_id: string };
    review?: {
      reviewer_id: string;
      comment: string;
      decision: string;
      created_at: string;
    };
    test_results?: Array<{
      tester_id: string;
      status: string;
      comment: string;
      created_at: string;
    }>;
    created_at?: string;
  }

  interface ProblemDetailApiPayload {
    problem_draft_id?: string;
    problem_id?: string;
    versions?: ApiVersion[] | unknown;
    target_contest?: { contest_id?: string } | null;
    comments?: string[] | unknown;
    created_at?: string;
    updated_at?: string;
    status?: string;
  }

  const transformProblemDetailResponse = (
    problemPayload: ProblemDetailApiPayload,
  ): Problem => {
    const versions: ApiVersion[] = Array.isArray(problemPayload.versions)
      ? (problemPayload.versions as ApiVersion[])
      : [];
    const latestVersion = versions[0];

    const detailsObj = pickPrimaryDetail(
      (latestVersion?.details as Array<Problem['details']>) || undefined,
    );

    return {
      problem_draft_id:
        problemPayload.problem_draft_id || problemPayload.problem_id || '',
      submitted_problem_id: problemPayload.problem_id,
      details: detailsObj,
      examples: Array.isArray(latestVersion?.examples)
        ? latestVersion.examples
        : [],
      problem_difficulty_id:
        latestVersion?.problem_difficulty?.problem_difficulty_id || '',
      is_submitted: true,
      target_contest_id:
        (problemPayload.target_contest &&
          (problemPayload.target_contest as { contest_id?: string })
            .contest_id) ||
        '',
      comments: Array.isArray(problemPayload.comments)
        ? problemPayload.comments
        : [],
      created_at: problemPayload.created_at || '',
      updated_at: problemPayload.updated_at || '',
      status: normalizeProblemStatus(problemPayload.status),
      versions: versions.map((version: ApiVersion) => ({
        version_id: version.version_id,
        details: Array.isArray(version.details) ? version.details : [],
        examples: Array.isArray(version.examples) ? version.examples : [],
        problem_difficulty: version.problem_difficulty,
        review: version.review,
        test_results: version.test_results,
        created_at: version.created_at,
      })),
    };
  };

  const loadPublishedProblem = async (
    problemId: string,
    options: { showToast?: boolean } = {},
  ) => {
    const { showToast = true } = options;
    const loadingToast = showToast
      ? toast.loading('Loading problem details...')
      : null;
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load problem details');
      }

      const data = await response.json();
      const convertedProblem = transformProblemDetailResponse(data.problem);
      setCurrentProblem(convertedProblem);
      setCurrentProblemType('published');
      setDetailMode('view');
      setEditingProblemId(problemId);
      setCurrentView('detail');
    } catch (error) {
      console.error('Error fetching problem details:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load problem details',
      );
    } finally {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch problem drafts
        const [draftResponse, publishedResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/problem-drafts`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          }),
          fetch(`${API_BASE_URL}/problems`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          }),
        ]);

        if (!draftResponse.ok) {
          throw new Error(
            (await draftResponse.json()).message ||
              'Failed to load problem drafts',
          );
        }

        let publishedData: { problems: PublishedProblem[] } = { problems: [] };

        if (publishedResponse.ok) {
          publishedData = await publishedResponse.json();
          console.log('Published problems:', publishedData);
        }

        const draftData = await draftResponse.json();
        console.log(draftData, publishedData);

        if (isMounted) {
          // Transform draft problems
          const transformedDraftProblems = Array.isArray(
            draftData?.problem_drafts,
          )
            ? draftData.problem_drafts.map((draft: DraftApiProblem) =>
                mapDraftToProblem(draft),
              )
            : [];

          // Transform published problems
          const transformedPublishedProblems = Array.isArray(
            publishedData?.problems,
          )
            ? publishedData.problems.map(
                (problem: {
                  problem_id: string;
                  problem_draft_id?: string;
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
                      : { language: 'en-US', title: '' };

                  // Initial problem object with title from list endpoint
                  return {
                    problem_id: problem.problem_id,
                    problem_draft_id: problem.problem_draft_id,
                    submitted_problem_id: problem.problem_id,
                    title: problem.title,
                    status: normalizeProblemStatus(problem.status),
                    creator: problem.creator,
                    reviewer: problem.reviewer,
                    testers: problem.testers,
                    target_contest: problem.target_contest,
                    assigned_contest: problem.assigned_contest,
                    problem_difficulty: problem.problem_difficulty,
                    created_at: problem.created_at,
                    updated_at: problem.updated_at,

                    // Create placeholder details
                    details: {
                      language: titleObj.language,
                      title: titleObj.title,
                      background: '',
                      statement: '',
                      input_format: '',
                      output_format: '',
                      note: '',
                    },
                    examples: [],
                    comments: [],
                  } as PublishedProblem;
                },
              )
            : [];

          // Store the original problems
          setProblemDrafts(transformedDraftProblems);
          setPublishedProblems(transformedPublishedProblems);

          // Store the original problems; combined list is derived below
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        if (isMounted) {
          setProblemDrafts([]);
          setPublishedProblems([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter combined problems based on search term and current user filter
  const currentUserId = localStorage.getItem('userId');
  const filteredAndSortedProblems = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    const filtered = combinedProblems.filter((problem) => {
      const matchesSearchTerm = problem.title
        ?.toLowerCase()
        .includes(searchLower);

      const matchesCurrentUser =
        !showMyProblemsOnly ||
        (problem.originalProblem &&
          ((problem.type === 'published' &&
            (problem.originalProblem as PublishedProblem).creator?.user_id ===
              currentUserId) ||
            problem.type === 'draft'));

      // Filter by active tab
      if (activeTab === 'all') {
        return matchesSearchTerm && matchesCurrentUser;
      }

      const isDraft =
        problem.status === 'draft' ||
        problem.status === 'needs_revision' ||
        problem.status === 'testing_changes_requested';
      const matchesTab = activeTab === 'drafts' ? isDraft : !isDraft;

      return matchesSearchTerm && matchesCurrentUser && matchesTab;
    });

    if (!sortColumn) {
      return filtered;
    }

    const toSortableValue = (
      problem: CombinedProblemListItem,
      column: keyof CombinedProblemListItem,
    ): number | string => {
      switch (column) {
        case 'created_at':
        case 'updated_at': {
          const raw = problem[column];
          const value = typeof raw === 'string' ? raw : '';
          const timestamp = Date.parse(value);
          return Number.isNaN(timestamp) ? 0 : timestamp;
        }
        case 'title':
        case 'status':
        default: {
          const raw = problem[column];
          return (typeof raw === 'string' ? raw : '').toLowerCase();
        }
      }
    };

    const sorted = [...filtered].sort((a, b) => {
      const valueA = toSortableValue(a, sortColumn);
      const valueB = toSortableValue(b, sortColumn);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        const diff = valueA - valueB;
        return sortDirection === 'asc' ? diff : -diff;
      }

      return sortDirection === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    return sorted;
  }, [
    combinedProblems,
    currentUserId,
    searchTerm,
    showMyProblemsOnly,
    sortColumn,
    sortDirection,
    activeTab,
  ]);

  // Sort problems based on current sort column and direction
  const handleSort = (column: keyof CombinedProblemListItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Helper to render sort indicator
  const renderSortIndicator = (column: keyof CombinedProblemListItem) => {
    if (sortColumn !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  const handleDeleteProblem = (id: string, type: ProblemType) => {
    // Only drafts can be deleted
    if (type !== 'draft') {
      toast.error('Published problems cannot be deleted.');
      return;
    }

    // Find the problem title for the confirmation message
    const problemToDelete = combinedProblems.find(
      (p) => p.id === id && p.type === type,
    );
    const problemTitle = problemToDelete?.title || 'this problem';

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[400px]">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Delete Problem?
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">"{problemTitle}"</span>
              </p>
            </div>
          </div>

          {/* Warning message */}
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              This action{' '}
              <span className="font-semibold">cannot be undone</span>. All
              problem data will be permanently deleted.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                setIsLoading(true);
                const loadingToast = toast.loading('Deleting problem...');

                fetch(`${API_BASE_URL}/problem-drafts/${id}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'abc',
                  },
                  credentials: 'include',
                })
                  .then((response) => {
                    if (!response.ok) {
                      return response.json().then((data) => {
                        throw new Error(
                          data.message || 'Failed to delete problem',
                        );
                      });
                    }

                    // Remove the deleted draft locally so the table updates immediately
                    setProblemDrafts((prevDrafts) =>
                      prevDrafts.filter(
                        (problem) => problem.problem_draft_id !== id,
                      ),
                    );

                    toast.dismiss(loadingToast);
                    toast.success(
                      `Problem "${problemTitle}" has been deleted successfully.`,
                    );
                  })
                  .catch((error) => {
                    console.error('Error deleting problem:', error);
                    toast.dismiss(loadingToast);
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Failed to delete problem',
                    );
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg text-white font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 15000,
        style: {
          maxWidth: '500px',
          padding: '20px',
        },
      },
    );
  };

  const handleSubmitProblem = (id: string) => {
    // Find the problem title for the confirmation message
    const problemToSubmit = combinedProblems.find((p) => p.id === id);
    const problemTitle = problemToSubmit?.title || 'this problem';

    // Custom confirm dialog using toast
    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[400px]">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <PaperAirplaneIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Submit Problem for Review?
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">"{problemTitle}"</span>
              </p>
            </div>
          </div>

          {/* Warning message */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Once submitted, the problem will be sent for review and{' '}
              <span className="font-semibold">cannot be modified further</span>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                submitProblem(id);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      ),
      {
        duration: 15000,
        style: {
          maxWidth: '500px',
          padding: '20px',
        },
      },
    );
  };

  const submitProblem = async (id: string) => {
    console.log(id);
    try {
      // Show loading state
      setIsLoading(true);
      const loadingToast = toast.loading('Submitting problem...');

      const response = await fetch(
        `${API_BASE_URL}/problem-drafts/${id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit problem');
      }
      const data = await response.json();
      const newProblemId: string | undefined = data?.problem_id;

      // Get current user info for creator attribution
      const currentUserId = localStorage.getItem('userId') || '';
      const currentUserName = localStorage.getItem('userName') || 'You';

      // Find the just-submitted draft's title to carry over
      const submittedListItem = combinedProblems.find(
        (p) => p.id === id && p.type === 'draft',
      );
      const submittedTitle = submittedListItem?.title || '';
      const nowIso = new Date().toISOString();

      // Remove the draft from local list so it disappears immediately
      setProblemDrafts((prevDrafts) =>
        prevDrafts.filter((problem) => problem.problem_draft_id !== id),
      );

      const publishedId = newProblemId ?? id;
      const minimalPublished: PublishedProblem = {
        problem_id: publishedId,
        title: [{ language: 'en-US', title: submittedTitle }],
        status: 'pending_review',
        creator: { user_id: currentUserId, username: currentUserName },
        reviewer: undefined,
        testers: [],
        target_contest: null,
        assigned_contest: null,
        problem_difficulty: {
          problem_difficulty_id: '',
          display_names: [],
        },
        created_at: nowIso,
        updated_at: nowIso,
        details: {
          language: 'en-US',
          title: submittedTitle,
          background: '',
          statement: '',
          input_format: '',
          output_format: '',
          note: '',
        },
        examples: [],
        comments: [],
      } as PublishedProblem;

      // Add or replace the corresponding published problem entry so it appears in the table
      setPublishedProblems((prevPublished) => [
        minimalPublished,
        ...prevPublished.filter(
          (problem) => problem.problem_id !== publishedId,
        ),
      ]);

      // Show success message
      toast.dismiss(loadingToast);
      toast.success('Problem submitted successfully!');
    } catch (error) {
      console.error('Error submitting problem:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit problem',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPublishedProblem = async (problemId?: string) => {
    const baseProblemId =
      problemId ||
      editingProblemId ||
      currentProblem?.submitted_problem_id ||
      null;

    if (!baseProblemId) {
      toast.error('Unable to determine which problem to edit.');
      return;
    }

    const loadingToast = toast.loading('Preparing editable draft...');
    try {
      const response = await fetch(
        `${API_BASE_URL}/problems/${baseProblemId}/checkout-draft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to prepare draft');
      }

      const data = await response.json();
      const draftProblem = mapDraftToProblem(
        data.problem_draft as DraftApiProblem,
      );
      draftProblem.submitted_problem_id =
        draftProblem.submitted_problem_id || baseProblemId;
      draftProblem.status = currentProblem?.status || draftProblem.status;

      setProblemDrafts((prevDrafts) => {
        const withoutCurrent = prevDrafts.filter(
          (draft) => draft.problem_draft_id !== draftProblem.problem_draft_id,
        );
        return [...withoutCurrent, draftProblem];
      });

      setCurrentProblem(draftProblem);
      setCurrentProblemType('draft');
      setDetailMode('edit');
      setEditingProblemId(baseProblemId);
      setCurrentView('detail');
      toast.success('Draft ready for editing');
    } catch (error) {
      console.error('Error preparing draft for edit:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to prepare draft',
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  useEffect(() => {
    console.log('Current problem type:', currentProblemType);
    console.log('Current problem:', currentProblem);
  }, [currentProblemType, currentProblem]);

  const handleProblemClick = (id: string, type: ProblemType) => {
    if (type === 'draft') {
      const problem = problemDrafts.find((p) => p.problem_draft_id === id);
      if (problem) {
        setCurrentProblem(problem);
        setCurrentProblemType('draft');
        setDetailMode('edit');
        setEditingProblemId(problem.submitted_problem_id || null);
        setCurrentView('detail');
      }
    } else if (type === 'published') {
      loadPublishedProblem(id);
    }
  };

  const handleAddNewProblem = () => {
    setCurrentProblem(null);
    setCurrentProblemType('draft');
    setDetailMode('edit');
    setEditingProblemId(null);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentProblem(null);
    setCurrentProblemType('draft');
    setDetailMode('edit');
    setEditingProblemId(null);
  };

  const handleDetailCancel = () => {
    if (
      detailMode === 'edit' &&
      editingProblemId &&
      currentProblem?.submitted_problem_id === editingProblemId
    ) {
      loadPublishedProblem(editingProblemId, { showToast: false });
      return;
    }

    handleBackToList();
  };

  // Navigation to chat for a specific problem
  const handleNavigateToChat = (id: string) => {
    window.location.href = `/chat/${id}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-900 w-full">
        <div className="flex-1 p-6 overflow-auto flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      {currentView === 'list' && (
        <div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-2xl font-medium text-white">
              {t('problemSetting.title')}
            </h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder={t('problemSetting.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleAddNewProblem}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                type="button"
              >
                {t('problemSetting.addNewProblem')}
              </button>
            </div>
          </div>

          {/* Tabs for All, Drafts and Submissions */}
          <div className="flex border-b border-slate-700/50 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
              type="button"
            >
              All Problems
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'drafts'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
              type="button"
            >
              Drafts & Revisions
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'submissions'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
              type="button"
            >
              Submissions
            </button>
          </div>
          <ProblemList
            problems={filteredAndSortedProblems}
            onProblemClick={handleProblemClick}
            onDeleteProblem={handleDeleteProblem}
            onAddNewProblem={handleAddNewProblem}
            onSubmitProblem={handleSubmitProblem}
            onNavigateToChat={handleNavigateToChat}
            searchTerm={searchTerm}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            renderSortIndicator={renderSortIndicator}
          />
        </div>
      )}

      {currentView === 'detail' && (
        <>
          {currentProblem &&
          currentProblemType === 'published' &&
          detailMode === 'view' ? (
            <ProblemReadOnlyView
              problem={currentProblem}
              problemType={currentProblemType}
              onBack={handleBackToList}
              onEdit={() => {
                // For published problems, use problem_id; for drafts use submitted_problem_id
                const problemId =
                  'problem_id' in currentProblem
                    ? (currentProblem as { problem_id?: string }).problem_id
                    : (currentProblem as Problem).submitted_problem_id;
                if (problemId) {
                  handleEditPublishedProblem(problemId);
                }
              }}
            />
          ) : (
            <ProblemDetail
              problem={currentProblem}
              isReadOnly={false}
              onSave={async (problem) => {
                // Check if this is an edit of an existing problem
                const isEditing = Boolean(problem.submitted_problem_id);

                const apiProblemData: SaveProblemPayload = {
                  details: [problem.details],
                  examples: problem.examples,
                  problem_difficulty_id:
                    problem.problem_difficulty_id ||
                    '01969fec-37ad-7908-bd91-a70a3b96ac96',
                };
                if (problem.problem_draft_id) {
                  apiProblemData.problem_draft_id = problem.problem_draft_id;
                }

                const loadingToast = toast.loading(
                  isEditing ? 'Saving changes...' : 'Saving problem...',
                );
                try {
                  // First save the draft
                  const response = await fetch(
                    `${API_BASE_URL}/problem-drafts`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'abc',
                      },
                      credentials: 'include',
                      body: JSON.stringify(apiProblemData),
                    },
                  );

                  if (!response.ok) {
                    throw new Error('Failed to save problem');
                  }
                  const data = await response.json();
                  const serverId: string =
                    data?.problem_draft_id || problem.problem_draft_id;

                  if (isEditing) {
                    // For editing: submit the draft to update the problem
                    const submitResponse = await fetch(
                      `${API_BASE_URL}/problem-drafts/${serverId}/submit`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'ngrok-skip-browser-warning': 'abc',
                        },
                        credentials: 'include',
                      },
                    );

                    if (!submitResponse.ok) {
                      const errorData = await submitResponse.json();
                      throw new Error(
                        errorData.message || 'Failed to submit changes',
                      );
                    }

                    // Remove the draft from local state
                    setProblemDrafts((prevDrafts) =>
                      prevDrafts.filter(
                        (draft) => draft.problem_draft_id !== serverId,
                      ),
                    );

                    // Reload published problems to show the updated status
                    const publishedResponse = await fetch(
                      `${API_BASE_URL}/problems`,
                      {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                          'ngrok-skip-browser-warning': 'abc',
                        },
                        credentials: 'include',
                      },
                    );

                    if (publishedResponse.ok) {
                      const publishedData = await publishedResponse.json();
                      const transformedPublishedProblems = Array.isArray(
                        publishedData?.problems,
                      )
                        ? publishedData.problems.map(
                            (problem: {
                              problem_id: string;
                              problem_draft_id?: string;
                              title: Array<{ language: string; title: string }>;
                              status: string;
                              creator?: { user_id: string; username: string };
                              reviewer?: { user_id: string; username: string };
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
                            }) => ({
                              problem_id: problem.problem_id,
                              problem_draft_id: problem.problem_draft_id,
                              submitted_problem_id: problem.problem_id,
                              title: problem.title,
                              status: normalizeProblemStatus(problem.status),
                              creator: problem.creator,
                              reviewer: problem.reviewer,
                              testers: problem.testers,
                              target_contest: problem.target_contest,
                              assigned_contest: problem.assigned_contest,
                              problem_difficulty: problem.problem_difficulty,
                              created_at: problem.created_at,
                              updated_at: problem.updated_at,
                              details: {
                                language:
                                  problem.title?.[0]?.language || 'en-US',
                                title: problem.title?.[0]?.title || '',
                                background: '',
                                statement: '',
                                input_format: '',
                                output_format: '',
                                note: '',
                              },
                              examples: [],
                              comments: [],
                            }),
                          )
                        : [];
                      setPublishedProblems(transformedPublishedProblems);
                    }

                    toast.dismiss(loadingToast);
                    toast.success('Changes saved successfully!');
                    handleBackToList();
                  } else {
                    // For new drafts: just save
                    const nowIso = new Date().toISOString();
                    const normalizedProblem: Problem = {
                      ...problem,
                      problem_draft_id: serverId,
                      created_at: problem.created_at || nowIso,
                      updated_at: problem.updated_at || nowIso,
                    };

                    setProblemDrafts((prevDrafts) => {
                      // Remove any existing draft with the same ID or empty ID
                      const withoutCurrent = prevDrafts.filter(
                        (draft) =>
                          draft.problem_draft_id !== serverId &&
                          draft.problem_draft_id !== '',
                      );
                      return [...withoutCurrent, normalizedProblem];
                    });

                    toast.dismiss(loadingToast);
                    toast.success('Problem saved successfully!');
                    handleBackToList();
                  }
                } catch (error) {
                  console.error('Error saving problem:', error);
                  toast.dismiss(loadingToast);
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Failed to save problem',
                  );
                }
              }}
              {...(!currentProblem?.submitted_problem_id && {
                onSubmit: async (problem) => {
                  // Ensure we have a server-side draft ID before submitting
                  let draftId = problem.problem_draft_id;
                  try {
                    if (
                      !draftId ||
                      !problemDrafts.some((d) => d.problem_draft_id === draftId)
                    ) {
                      const apiProblemData: SaveProblemPayload = {
                        details: [problem.details],
                        examples: problem.examples,
                        problem_difficulty_id:
                          problem.problem_difficulty_id ||
                          '01969fec-37ad-7908-bd91-a70a3b96ac96',
                      };
                      if (draftId) {
                        apiProblemData.problem_draft_id = draftId;
                      }

                      const savingToast = toast.loading(
                        'Saving draft before submitting...',
                      );
                      const saveResp = await fetch(
                        `${API_BASE_URL}/problem-drafts`,
                        {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'abc',
                          },
                          credentials: 'include',
                          body: JSON.stringify(apiProblemData),
                        },
                      );
                      if (!saveResp.ok) {
                        const err = await saveResp.json().catch(() => ({}));
                        throw new Error(err.message || 'Failed to save draft');
                      }
                      const saveData = await saveResp.json();
                      draftId = saveData?.problem_draft_id || draftId;

                      // Update local list with the saved draft
                      if (draftId) {
                        const nowIso = new Date().toISOString();
                        const normalized: Problem = {
                          ...problem,
                          problem_draft_id: draftId,
                          is_submitted: false,
                          created_at: problem.created_at || nowIso,
                          updated_at: nowIso,
                        };
                        setProblemDrafts((prev) => {
                          const withoutDup = prev.filter(
                            (d) => d.problem_draft_id !== draftId,
                          );
                          return [...withoutDup, normalized];
                        });
                      }
                      toast.dismiss(savingToast);
                    }

                    if (!draftId) {
                      throw new Error('No draft ID available to submit');
                    }
                    await handleSubmitProblem(draftId);
                  } catch (e) {
                    console.error('Submit flow failed:', e);
                    toast.error(
                      e instanceof Error
                        ? e.message
                        : 'Failed to submit problem',
                    );
                  }
                },
              })}
              onCancel={handleDetailCancel}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProblemSetting;
