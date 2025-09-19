import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../config'; // added
import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';
import {
  CombinedProblemListItem,
  Problem,
  ProblemExample,
  ProblemType,
  PublishedProblem,
  SaveProblemPayload,
  ViewType,
} from './types';

const ProblemSetting = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentProblemType, setCurrentProblemType] =
    useState<ProblemType>('draft');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<
    keyof CombinedProblemListItem | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const showMyProblemsOnly = true;

  // State for separate problem types
  const [problemDrafts, setProblemDrafts] = useState<Problem[]>([]);
  const [publishedProblems, setPublishedProblems] = useState<
    PublishedProblem[]
  >([]);
  const [combinedProblems, setCombinedProblems] = useState<
    CombinedProblemListItem[]
  >([]);

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
            ? draftData.problem_drafts.map(
                (problem: {
                  problem_draft_id: string;
                  details: Array<{
                    language: string;
                    title: string;
                    background: string;
                    statement: string;
                    input_format: string;
                    output_format: string;
                    note: string;
                  }>;
                  examples: ProblemExample[];
                  problem_difficulty_id: string;
                  is_submitted: boolean;
                  target_contest_id: string;
                  comments: string[];
                  created_at: string;
                  updated_at: string;
                }) => ({
                  ...problem,
                  // Take the first language version from the array (or create an empty object if details is empty)
                  details:
                    Array.isArray(problem.details) && problem.details.length > 0
                      ? problem.details[0]
                      : {
                          language: 'en-US',
                          title: '',
                          background: '',
                          statement: '',
                          input_format: '',
                          output_format: '',
                          note: '',
                        },
                }),
              )
            : [];

          // Transform published problems
          const transformedPublishedProblems = Array.isArray(
            publishedData?.problems,
          )
            ? publishedData.problems.map(
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
                      : { language: 'en-US', title: '' };

                  // Initial problem object with title from list endpoint
                  return {
                    problem_id: problem.problem_id,
                    title: problem.title,
                    status: problem.status,
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
          // Create combined list for display
          const combinedList: CombinedProblemListItem[] = [
            // Map drafts to combined format
            ...transformedDraftProblems.map(
              (draft: Problem): CombinedProblemListItem => ({
                id: draft.problem_draft_id,
                type: 'draft' as ProblemType,
                title: draft.details.title,
                status: draft.is_submitted ? 'submitted' : 'draft',
                created_at: draft.created_at,
                updated_at: draft.updated_at,
                originalProblem: draft,
              }),
            ),
            // Map published problems to combined format
            ...transformedPublishedProblems.map((pub) => ({
              id: pub.problem_id,
              type: 'published' as ProblemType,
              title: pub.details?.title || '',
              status: pub.status || 'published',
              created_at: pub.created_at,
              updated_at: pub.updated_at,
              originalProblem: pub,
            })),
          ];

          setCombinedProblems(combinedList);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        if (isMounted) {
          setProblemDrafts([]);
          setPublishedProblems([]);
          setCombinedProblems([]);
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
  const filteredProblems = combinedProblems.filter((problem) => {
    // Filter by search term
    const matchesSearchTerm = problem.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    // Filter by current user if the toggle is on
    const matchesCurrentUser =
      !showMyProblemsOnly ||
      (problem.originalProblem &&
        ((problem.type === 'published' &&
          (problem.originalProblem as PublishedProblem).creator?.user_id ===
            currentUserId) ||
          problem.type === 'draft'));

    return matchesSearchTerm && matchesCurrentUser;
  });

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
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete "{problemTitle}"?</p>
          <p className="text-gray-400 text-sm">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2 justify-end">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
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

                    // Update both the original drafts array and the combined list
                    setProblemDrafts(
                      problemDrafts.filter(
                        (problem) => problem.problem_draft_id !== id,
                      ),
                    );
                    setCombinedProblems(
                      combinedProblems.filter(
                        (problem) =>
                          !(problem.id === id && problem.type === 'draft'),
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
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 10000 },
    );
  };

  const handleSubmitProblem = (id: string) => {
    // Find the problem title for the confirmation message
    const problemToSubmit = combinedProblems.find((p) => p.id === id);
    const problemTitle = problemToSubmit?.title || 'this problem';

    // Custom confirm dialog using toast
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to submit "{problemTitle}"?</p>
          <p className="text-gray-400 text-sm">
            Once submitted, the problem will be sent for review and cannot be
            modified further.
          </p>
          <div className="flex gap-2 mt-2 justify-end">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                submitProblem(id);
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
            >
              Submit
            </button>
          </div>
        </div>
      ),
      { duration: 10000 },
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

      // Remove the draft from drafts
      setProblemDrafts(
        problemDrafts.filter((problem) => problem.problem_draft_id !== id),
      );

      // Add a minimal published problem so it can be opened immediately
      if (newProblemId) {
        const minimalPublished: PublishedProblem = {
          problem_id: newProblemId,
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
          // details/examples/comments will be filled when fetching details
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

        setPublishedProblems([minimalPublished, ...publishedProblems]);

        // Replace the draft list item with a published one using server ID
        setCombinedProblems(
          combinedProblems.map((p) =>
            p.id === id && p.type === 'draft'
              ? {
                  id: newProblemId,
                  type: 'published',
                  title: submittedTitle,
                  status: 'pending_review',
                  created_at: nowIso,
                  updated_at: nowIso,
                  originalProblem: minimalPublished,
                }
              : p,
          ),
        );
      } else {
        // Fallback: keep the entry but mark as published so it stays visible
        setCombinedProblems(
          combinedProblems.map((p) =>
            p.id === id && p.type === 'draft'
              ? {
                  ...p,
                  type: 'published',
                  status: 'pending_review',
                }
              : p,
          ),
        );
      }

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

  useEffect(() => {
    console.log('Current problem type:', currentProblemType);
    console.log('Current problem:', currentProblem);
  }, [currentProblemType, currentProblem]);

  const handleProblemClick = (id: string, type: ProblemType) => {
    // Find the selected problem and set the view to detail
    if (type === 'draft') {
      const problem = problemDrafts.find((p) => p.problem_draft_id === id);
      if (problem) {
        setCurrentProblem(problem);
        setCurrentProblemType('draft');
        setCurrentView('detail');
      }
    } else if (type === 'published') {
      const problem = publishedProblems.find((p) => p.problem_id === id);
      if (problem) {
        // Fetch full problem details when viewing a published problem
        const loadingToast = toast.loading('Loading problem details...');

        fetch(`${API_BASE_URL}/problems/${id}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to load problem details');
            }
            return response.json();
          })
          .then((data) => {
            toast.dismiss(loadingToast);

            const latestVersion = data.problem.versions[0];

            // Get the English details or fallback to first available
            const detailsObj =
              Array.isArray(latestVersion.details) &&
              latestVersion.details.length > 0
                ? latestVersion.details.find(
                    (d: { language: string }) => d.language === 'en-US',
                  ) || latestVersion.details[0]
                : {
                    language: 'en-US',
                    title: '',
                    background: '',
                    statement: '',
                    input_format: '',
                    output_format: '',
                    note: '',
                  };

            // Convert to our internal Problem format
            const convertedProblem: Problem = {
              problem_draft_id: data.problem.problem_id,
              details: {
                language: detailsObj.language,
                title: detailsObj.title,
                background: detailsObj.background || '',
                statement: detailsObj.statement || '',
                input_format: detailsObj.input_format || '',
                output_format: detailsObj.output_format || '',
                note: detailsObj.note || '',
              },
              examples: Array.isArray(latestVersion.examples)
                ? latestVersion.examples
                : [],
              problem_difficulty_id:
                latestVersion.problem_difficulty?.problem_difficulty_id || '',
              is_submitted: true,
              target_contest_id: data.problem.target_contest?.id || '',
              comments: Array.isArray(data.problem.comments)
                ? data.problem.comments
                : [],
              created_at: data.problem.created_at,
              updated_at: data.problem.updated_at,
              status: data.problem.status,
            };

            setCurrentProblem(convertedProblem);
            setCurrentProblemType('published');
            setCurrentView('detail');
          })
          .catch((error) => {
            console.error('Error fetching problem details:', error);
            toast.dismiss(loadingToast);
            toast.error(
              error instanceof Error
                ? error.message
                : 'Failed to load problem details',
            );

            // Fallback to basic details if full details fetch fails
            const convertedProblem: Problem = {
              problem_draft_id: problem.problem_id,
              details: {
                language: 'en-US',
                title:
                  Array.isArray(problem.title) && problem.title.length > 0
                    ? (
                        problem.title.find(
                          (t: { language: string; title: string }) =>
                            t.language === 'en-US',
                        ) || problem.title[0]
                      ).title
                    : '',
                background: '',
                statement: '',
                input_format: '',
                output_format: '',
                note: '',
              },
              examples: [],
              problem_difficulty_id:
                problem.problem_difficulty?.problem_difficulty_id || '',
              is_submitted: true,
              target_contest_id: '',
              comments: [],
              created_at: problem.created_at,
              updated_at: problem.updated_at,
            };

            setCurrentProblem(convertedProblem);
            setCurrentProblemType('published');
            setCurrentView('detail');
          });
      }
    }
  };

  const handleAddNewProblem = () => {
    // Switch to new problem view
    setCurrentProblem(null);
    setCurrentProblemType('draft');
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentProblem(null);
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
          <ProblemList
            problems={filteredProblems}
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
        <ProblemDetail
          problem={currentProblem}
          isReadOnly={
            currentProblemType === 'published' &&
            currentProblem?.status !== 'needs_revision'
          }
          onSave={async (problem) => {
            if (
              currentProblemType === 'draft' ||
              currentProblem?.status === 'needs_revision'
            ) {
              const isEditingExisting = Boolean(currentProblem);

              // Build payload; include problem_draft_id only for existing drafts
              const apiProblemData: SaveProblemPayload = {
                details: [problem.details],
                examples: problem.examples,
                problem_difficulty_id:
                  problem.problem_difficulty_id ||
                  '01969fec-37ad-7908-bd91-a70a3b96ac96',
              };
              if (isEditingExisting && problem.problem_draft_id) {
                apiProblemData.problem_draft_id = problem.problem_draft_id;
              }

              const loadingToast = toast.loading('Saving problem...');
              try {
                const response = await fetch(`${API_BASE_URL}/problem-drafts`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'abc',
                  },
                  credentials: 'include',
                  body: JSON.stringify(apiProblemData),
                });

                if (!response.ok) {
                  throw new Error('Failed to save problem');
                }
                const data = await response.json();
                const serverId: string =
                  data?.problem_draft_id || problem.problem_draft_id;

                // Normalize local state to use the server-assigned ID
                if (isEditingExisting) {
                  // Update existing draft entry; replace id if backend returned a different one
                  setProblemDrafts(
                    problemDrafts.map((p) =>
                      p.problem_draft_id === problem.problem_draft_id
                        ? { ...problem, problem_draft_id: serverId }
                        : p,
                    ),
                  );

                  setCombinedProblems(
                    combinedProblems.map((p) => {
                      if (
                        p.type === 'draft' &&
                        p.id === problem.problem_draft_id
                      ) {
                        return {
                          ...p,
                          id: serverId,
                          title: problem.details.title,
                          updated_at: new Date().toISOString(),
                          originalProblem: {
                            ...problem,
                            problem_draft_id: serverId,
                          },
                        };
                      }
                      return p;
                    }),
                  );
                } else {
                  // New draft: add using the server ID
                  const normalizedProblem: Problem = {
                    ...problem,
                    problem_draft_id: serverId,
                  };
                  setProblemDrafts([...problemDrafts, normalizedProblem]);
                  setCombinedProblems([
                    ...combinedProblems,
                    {
                      id: serverId,
                      type: 'draft',
                      title: normalizedProblem.details.title,
                      status: 'draft',
                      created_at:
                        normalizedProblem.created_at ||
                        new Date().toISOString(),
                      updated_at:
                        normalizedProblem.updated_at ||
                        new Date().toISOString(),
                      originalProblem: normalizedProblem,
                    },
                  ]);
                }

                toast.dismiss(loadingToast);
                toast.success('Problem saved successfully!');
                handleBackToList();
              } catch (error) {
                console.error('Error saving problem:', error);
                toast.dismiss(loadingToast);
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Failed to save problem',
                );
              }
            }
          }}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ProblemSetting;
