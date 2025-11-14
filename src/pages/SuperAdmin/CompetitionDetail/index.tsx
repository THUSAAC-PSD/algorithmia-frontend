import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { API_BASE_URL } from '../../../config';

interface Competition {
  contest_id: string;
  title: string;
  description: string;
  min_problem_count: number;
  max_problem_count: number;
  deadline_datetime: string;
  created_at: string;
  problems: Problem[];
}

interface Problem {
  problem_id: string;
  title: string;
  difficulty: string;
  is_assigned?: boolean;
}

const CompetitionDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());
  const [pendingRemoves, setPendingRemoves] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch competition data
  useEffect(() => {
    const fetchCompetition = async () => {
      setLoading(true);
      try {
        // Fetch all contests and find the one we need
        const contestResponse = await fetch(`${API_BASE_URL}/contests`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!contestResponse.ok) {
          throw new Error('Failed to fetch competitions');
        }

        const contestData = await contestResponse.json();
        const foundContest = (contestData.contests || []).find(
          (c: { contest_id: string }) => c.contest_id === id,
        );

        if (!foundContest) {
          throw new Error('Competition not found');
        }

        // Fetch assigned problems for this contest
        const assignedProblemsResponse = await fetch(
          `${API_BASE_URL}/contests/${id}/problems`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          },
        );

        let assignedProblems: Problem[] = [];
        if (assignedProblemsResponse.ok) {
          const assignedData = await assignedProblemsResponse.json();
          assignedProblems = (assignedData.problems || []).map(
            (p: {
              problem_id: string;
              title: Array<{ language: string; title: string }>;
              problem_difficulty?: {
                display_names: Array<{
                  language: string;
                  display_name: string;
                }>;
              };
            }) => ({
              problem_id: p.problem_id,
              title:
                Array.isArray(p.title) && p.title.length > 0
                  ? (
                      p.title.find(
                        (t: { language: string; title: string }) =>
                          t.language === 'en-US',
                      ) || p.title[0]
                    ).title
                  : 'Untitled',
              difficulty:
                Array.isArray(p.problem_difficulty?.display_names) &&
                p.problem_difficulty.display_names.length > 0
                  ? (
                      p.problem_difficulty.display_names.find(
                        (d: { language: string; display_name: string }) =>
                          d.language === 'en-US',
                      ) || p.problem_difficulty.display_names[0]
                    ).display_name
                  : 'Unknown',
              is_assigned: true,
            }),
          );
        }

        setCompetition({
          contest_id: foundContest.contest_id,
          title: foundContest.title,
          description: foundContest.description,
          min_problem_count: foundContest.min_problem_count,
          max_problem_count: foundContest.max_problem_count,
          deadline_datetime: foundContest.deadline_datetime,
          created_at: foundContest.created_at,
          problems: assignedProblems,
        });

        // Fetch all available problems
        const allProblemsResponse = await fetch(`${API_BASE_URL}/problems`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (allProblemsResponse.ok) {
          const problemsData = await allProblemsResponse.json();
          const assignedIds = new Set(
            assignedProblems.map((p) => p.problem_id),
          );

          const allProblems = (problemsData.problems || []).map(
            (p: {
              problem_id: string;
              title: Array<{ language: string; title: string }>;
              problem_difficulty?: {
                display_names: Array<{
                  language: string;
                  display_name: string;
                }>;
              };
            }) => ({
              problem_id: p.problem_id,
              title:
                Array.isArray(p.title) && p.title.length > 0
                  ? (
                      p.title.find(
                        (t: { language: string; title: string }) =>
                          t.language === 'en-US',
                      ) || p.title[0]
                    ).title
                  : 'Untitled',
              difficulty:
                Array.isArray(p.problem_difficulty?.display_names) &&
                p.problem_difficulty.display_names.length > 0
                  ? (
                      p.problem_difficulty.display_names.find(
                        (d: { language: string; display_name: string }) =>
                          d.language === 'en-US',
                      ) || p.problem_difficulty.display_names[0]
                    ).display_name
                  : 'Unknown',
              is_assigned: assignedIds.has(p.problem_id),
            }),
          );

          setAvailableProblems(allProblems);
        }
      } catch (error) {
        console.error('Failed to fetch competition:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load competition',
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompetition();
    }
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddProblem = (problem: Problem) => {
    if (!competition) return;

    // Check if problem is already assigned
    if (competition.problems.some((p) => p.problem_id === problem.problem_id)) {
      return;
    }

    // If this problem was pending removal, just remove it from pending
    if (pendingRemoves.has(problem.problem_id)) {
      const newPendingRemoves = new Set(pendingRemoves);
      newPendingRemoves.delete(problem.problem_id);
      setPendingRemoves(newPendingRemoves);
    } else {
      // Add to pending adds
      setPendingAdds(new Set(pendingAdds).add(problem.problem_id));
    }

    // Update local state immediately for UI
    setCompetition({
      ...competition,
      problems: [...competition.problems, { ...problem, is_assigned: true }],
    });

    setAvailableProblems(
      availableProblems.map((p) =>
        p.problem_id === problem.problem_id ? { ...p, is_assigned: true } : p,
      ),
    );
  };

  // Handle removing a problem from the competition
  const handleRemoveProblem = (problemId: string) => {
    if (!competition) return;

    // If this problem was pending add, just remove it from pending
    if (pendingAdds.has(problemId)) {
      const newPendingAdds = new Set(pendingAdds);
      newPendingAdds.delete(problemId);
      setPendingAdds(newPendingAdds);
    } else {
      // Add to pending removes
      setPendingRemoves(new Set(pendingRemoves).add(problemId));
    }

    // Update local state immediately for UI
    setCompetition({
      ...competition,
      problems: competition.problems.filter((p) => p.problem_id !== problemId),
    });

    // Update available problems
    setAvailableProblems(
      availableProblems.map((p) =>
        p.problem_id === problemId ? { ...p, is_assigned: false } : p,
      ),
    );
  };

  // Save all pending changes
  const handleSaveChanges = async () => {
    if (!competition) return;

    setIsSaving(true);
    console.log('Starting save...', {
      pendingAdds: Array.from(pendingAdds),
      pendingRemoves: Array.from(pendingRemoves),
    });

    try {
      // Process all additions
      for (const problemId of pendingAdds) {
        console.log('Adding problem:', problemId);
        const response = await fetch(
          `${API_BASE_URL}/contests/${id}/problems`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
            body: JSON.stringify({
              problem_id: problemId,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to add problem:', response.status, errorText);
          throw new Error(
            `Failed to add problem ${problemId}: ${response.status}`,
          );
        }
        console.log('Successfully added problem:', problemId);
      }

      // Process all removals
      for (const problemId of pendingRemoves) {
        console.log('Removing problem:', problemId);
        const response = await fetch(
          `${API_BASE_URL}/contests/${id}/problems`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
            body: JSON.stringify({
              problem_id: problemId,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            'Failed to remove problem:',
            response.status,
            errorText,
          );
          throw new Error(
            `Failed to remove problem ${problemId}: ${response.status}`,
          );
        }
        console.log('Successfully removed problem:', problemId);
      }

      // Clear pending changes after successful save
      setPendingAdds(new Set());
      setPendingRemoves(new Set());

      console.log('All changes saved successfully');
      toast.success(
        `Successfully saved ${pendingAdds.size + pendingRemoves.size} changes`,
      );
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error(
        `Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = pendingAdds.size > 0 || pendingRemoves.size > 0;

  // Filter available problems for the modal
  const filteredProblems = availableProblems.filter(
    (problem) =>
      !problem.is_assigned &&
      (problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.difficulty.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-900 w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400">{t('competitions.loading')}</div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex flex-col h-full bg-slate-900 w-full items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">
            {t('competitions.competitionNotFound')}
          </div>
          {error && (
            <div className="text-slate-400 text-sm mb-4">Error: {error}</div>
          )}
          <button
            onClick={() => navigate('/contestmanager')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            type="button"
          >
            {t('competitions.backToList')}
          </button>
        </div>
      </div>
    );
  }

  // Generate JSON export
  const exportToJson = async () => {
    if (!competition) return;

    try {
      // Fetch full details for each assigned problem
      const problemDetailsPromises = competition.problems.map(
        async (problem) => {
          const response = await fetch(
            `${API_BASE_URL}/problems/${problem.problem_id}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'abc',
              },
              credentials: 'include',
            },
          );

          if (response.ok) {
            return await response.json();
          }
          // Fallback to basic info if fetch fails
          return {
            problem_id: problem.problem_id,
            title: problem.title,
            difficulty: problem.difficulty,
          };
        },
      );

      const detailedProblems = await Promise.all(problemDetailsPromises);

      const exportData = {
        contest_id: competition.contest_id,
        title: competition.title,
        description: competition.description,
        min_problem_count: competition.min_problem_count,
        max_problem_count: competition.max_problem_count,
        deadline_datetime: competition.deadline_datetime,
        created_at: competition.created_at,
        problems: detailedProblems,
        statistics: {
          total_problems: competition.problems.length,
          requirement_status:
            competition.problems.length >= competition.min_problem_count &&
            competition.problems.length <= competition.max_problem_count
              ? 'met'
              : competition.problems.length < competition.min_problem_count
                ? 'insufficient'
                : 'exceeded',
        },
      };

      // Create and download the JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${competition.title.replace(/\s+/g, '-').toLowerCase()}-contest.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export contest:', error);
      toast.error('Failed to export contest data');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/contestmanager')}
            className="flex items-center text-slate-400 hover:text-white transition-colors mr-4"
            type="button"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            {t('competitions.backToList')}
          </button>
          <h1 className="text-2xl font-bold text-white">{competition.title}</h1>
          <div className="ml-auto flex items-center gap-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-lg"
                type="button"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Save Changes ({pendingAdds.size + pendingRemoves.size})
                  </>
                )}
              </button>
            )}
            <button
              onClick={exportToJson}
              className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              type="button"
              title={t('competitions.export')}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              {t('competitions.export')}
            </button>
          </div>
        </div>

        {/* Competition Details */}
        <div className="bg-slate-800 rounded-lg mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-medium text-white">
              {t('competitions.competitionDetails')}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  {t('competitions.description')}
                </h3>
                <p className="text-slate-300">{competition.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">
                    {t('competitions.contestId')}
                  </h3>
                  <p className="text-slate-300">{competition.contest_id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">
                    {t('competitions.deadline')}
                  </h3>
                  <p className="flex items-center text-slate-300">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(competition.deadline_datetime)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">
                    {t('competitions.problemRequirement')}
                  </h3>
                  <p className="text-slate-300">
                    {t('competitions.problemRequirement', {
                      min: competition.min_problem_count,
                      max: competition.max_problem_count,
                      count: competition.problems.length,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">
              {t('competitions.assignedProblems')}
            </h2>

            <button
              onClick={() => setShowAddProblemModal(true)}
              className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              type="button"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              {t('competitions.addProblem')}
            </button>
          </div>

          <div className="p-6">
            {competition.problems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {t('competitions.noProblemsAssigned')}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {competition.problems.map((problem) => (
                  <div
                    key={problem.problem_id}
                    className="py-4 flex items-center justify-between hover:bg-slate-700/20 px-4 rounded-lg -mx-4"
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <h3 className="text-white font-medium">
                          {problem.title}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {problem.problem_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full mr-4 ${
                          problem.difficulty === 'Easy'
                            ? 'bg-green-500/20 text-green-400'
                            : problem.difficulty === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {problem.difficulty}
                      </span>

                      <button
                        onClick={() => handleRemoveProblem(problem.problem_id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        type="button"
                        title={t('competitions.removeProblem')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showAddProblemModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div
              className="bg-slate-800 rounded-lg max-w-2xl w-full overflow-hidden shadow-xl"
              style={{
                animation: 'scaleIn 0.2s ease-out forwards',
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-medium text-white">
                  {t('competitions.addProblems')}
                </h2>
                <button
                  onClick={() => setShowAddProblemModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                  type="button"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('competitions.searchProblems')}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredProblems.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      {searchTerm
                        ? t('competitions.noMatchingProblems')
                        : t('competitions.allProblemsAssigned')}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {filteredProblems.map((problem) => (
                        <div
                          key={problem.problem_id}
                          className="py-4 flex items-center justify-between hover:bg-slate-700/20 px-4 rounded-lg -mx-4"
                        >
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3" />
                            <div>
                              <h3 className="text-white font-medium">
                                {problem.title}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {problem.problem_id}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 text-xs rounded-full mr-4 ${
                                problem.difficulty === 'Easy'
                                  ? 'bg-green-500/20 text-green-400'
                                  : problem.difficulty === 'Medium'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {problem.difficulty}
                            </span>

                            <button
                              onClick={() => handleAddProblem(problem)}
                              className="flex items-center px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
                              type="button"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              {t('competitions.add')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowAddProblemModal(false)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                    type="button"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    {t('common.done')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionDetail;
