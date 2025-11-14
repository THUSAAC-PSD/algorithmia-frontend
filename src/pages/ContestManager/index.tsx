import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import ProblemComponent, { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config';
import { normalizeProblemStatus } from '../../types/problem-status';

interface ApiContest {
  contest_id: string;
  title: string;
  description: string;
  min_problem_count: number;
  max_problem_count: number;
  deadline_datetime: string;
  created_at: string;
}

type Contest = ApiContest;

interface ApiProblemTitle {
  language: string;
  title: string;
}

interface ApiProblem {
  problem_id: string;
  title: ApiProblemTitle[];
  problem_difficulty?: {
    display_names?: Array<{ language: string; display_name: string }>;
  };
  assigned_contest?: {
    contest_id: string;
    title: string;
  } | null;
}

interface Problem {
  problem_id: string;
  title: string;
  difficulty: string;
  assignedContestId?: string;
  assignedContestTitle?: string;
}

interface ContestFormState {
  title: string;
  description: string;
  min_problem_count: number;
  max_problem_count: number;
  deadline_datetime: string;
}

const defaultFormState: ContestFormState = {
  title: '',
  description: '',
  min_problem_count: 1,
  max_problem_count: 5,
  deadline_datetime: '',
};

const parseErrorResponse = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data === 'string') {
      return data;
    }
    if (data?.message) {
      return data.message;
    }
  } catch {
    // ignore
  }

  return response.statusText || 'Request failed';
};

const ContestManagerPage = () => {
  const { t } = useTranslation();

  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(
    null,
  );
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemSearch, setProblemSearch] = useState('');
  const [showContestModal, setShowContestModal] = useState(false);
  const [contestForm, setContestForm] =
    useState<ContestFormState>(defaultFormState);
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);
  const [assigningProblemId, setAssigningProblemId] = useState<string | null>(
    null,
  );
  const [removingProblemId, setRemovingProblemId] = useState<string | null>(
    null,
  );
  const [selectedProblemDetail, setSelectedProblemDetail] =
    useState<IProblem | null>(null);
  const [loadingProblemDetailId, setLoadingProblemDetailId] = useState<
    string | null
  >(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contestRes, problemRes] = await Promise.all([
        fetch(`${API_BASE_URL}/contests`, {
          headers: { 'ngrok-skip-browser-warning': 'abc' },
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/problems`, {
          headers: { 'ngrok-skip-browser-warning': 'abc' },
          credentials: 'include',
        }),
      ]);

      if (!contestRes.ok) {
        throw new Error('Failed to load contests');
      }

      if (!problemRes.ok) {
        throw new Error('Failed to load problems');
      }

      const contestData = await contestRes.json();
      const problemData = await problemRes.json();

      const mappedContests: Contest[] = Array.isArray(contestData?.contests)
        ? (contestData.contests as ApiContest[])
        : [];

      const mappedProblems: Problem[] = Array.isArray(problemData?.problems)
        ? (problemData.problems as ApiProblem[]).map((problem) => {
            const title =
              problem.title?.find((t) => t.language === 'en-US')?.title ||
              problem.title?.[0]?.title ||
              'Untitled';
            const difficulty =
              problem.problem_difficulty?.display_names?.[0]?.display_name ||
              'Unknown';
            return {
              problem_id: problem.problem_id,
              title,
              difficulty,
              assignedContestId:
                problem.assigned_contest?.contest_id || undefined,
              assignedContestTitle:
                problem.assigned_contest?.title || undefined,
            };
          })
        : [];

      setContests(mappedContests);
      setProblems(mappedProblems);

      setSelectedContestId((prevSelected) => {
        if (mappedContests.length === 0) {
          return null;
        }

        if (
          prevSelected &&
          mappedContests.some((contest) => contest.contest_id === prevSelected)
        ) {
          return prevSelected;
        }

        return mappedContests[0].contest_id;
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to load contest data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedContest = contests.find(
    (contest) => contest.contest_id === selectedContestId,
  );

  const assignedProblems = useMemo(() => {
    if (!selectedContestId) return [];
    return problems.filter(
      (problem) => problem.assignedContestId === selectedContestId,
    );
  }, [problems, selectedContestId]);

  const availableProblems = useMemo(() => {
    const query = problemSearch.toLowerCase();
    return problems.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(query) ||
        problem.difficulty.toLowerCase().includes(query);
      const isAssignable =
        !problem.assignedContestId ||
        problem.assignedContestId === selectedContestId;
      return matchesSearch && isAssignable;
    });
  }, [problems, problemSearch, selectedContestId]);

  const handleOpenCreateModal = () => {
    setContestForm({
      ...defaultFormState,
      deadline_datetime: new Date().toISOString().split('T')[0],
    });
    setShowContestModal(true);
  };

  const handleCreateContest = async () => {
    setIsSubmittingContest(true);
    try {
      const payload = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        min_problem_count: contestForm.min_problem_count,
        max_problem_count: Math.max(
          contestForm.min_problem_count,
          contestForm.max_problem_count,
        ),
        deadline_datetime: new Date(
          contestForm.deadline_datetime,
        ).toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/contests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success(t('contestManager.toast.createSuccess'));
      setShowContestModal(false);
      await fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create contest',
      );
    } finally {
      setIsSubmittingContest(false);
    }
  };

  const handleAssignProblem = async (problemId: string) => {
    if (!selectedContest) return;
    setAssigningProblemId(problemId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/contests/${selectedContest.contest_id}/problems`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({ problem_id: problemId }),
        },
      );

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success(t('contestManager.toast.importSuccess'));
      setProblems((prev) =>
        prev.map((problem) =>
          problem.problem_id === problemId
            ? {
                ...problem,
                assignedContestId: selectedContest.contest_id,
                assignedContestTitle: selectedContest.title,
              }
            : problem,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to import problem',
      );
    } finally {
      setAssigningProblemId(null);
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!selectedContest) return;
    setRemovingProblemId(problemId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/contests/${selectedContest.contest_id}/problems`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({ problem_id: problemId }),
        },
      );

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success(t('contestManager.toast.removeSuccess'));
      setProblems((prev) =>
        prev.map((problem) =>
          problem.problem_id === problemId
            ? {
                ...problem,
                assignedContestId: undefined,
                assignedContestTitle: undefined,
              }
            : problem,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove problem',
      );
    } finally {
      setRemovingProblemId(null);
    }
  };

  const handleViewProblemDetails = async (problemId: string) => {
    const targetProblem = assignedProblems.find(
      (problem) => problem.problem_id === problemId,
    );
    if (!targetProblem) {
      return;
    }

    const placeholderProblem: IProblem = {
      id: targetProblem.problem_id,
      problem_difficulty: [
        {
          language: 'en-US',
          display_name: targetProblem.difficulty || 'Unknown',
        },
      ],
      details: [
        {
          language: 'en-US',
          title: targetProblem.title,
          background: '',
          statement: '',
          input_format: '',
          output_format: '',
          note: '',
        },
      ],
      examples: [],
      is_submitted: true,
      created_at: new Date(),
      updated_at: new Date(),
      author: undefined,
      status: undefined,
    };

    setSelectedProblemDetail(placeholderProblem);
    setLoadingProblemDetailId(problemId);

    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
        method: 'GET',
        headers: { 'ngrok-skip-browser-warning': 'abc' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      const data = await response.json();
      const problemPayload = data?.problem;
      const latestVersion = problemPayload?.versions?.[0];

      if (!problemPayload || !latestVersion) {
        throw new Error('Problem details are unavailable');
      }

      const detailsObj = Array.isArray(latestVersion.details)
        ? latestVersion.details.find(
            (detail: { language: string }) => detail.language === 'en-US',
          ) || latestVersion.details[0]
        : null;

      const displayDetails = detailsObj || {
        language: 'en-US',
        title: targetProblem.title,
        background: '',
        statement: '',
        input_format: '',
        output_format: '',
        note: '',
      };

      const mappedDifficulty =
        latestVersion.problem_difficulty?.display_names?.map(
          (displayName: { language: string; display_name: string }) => ({
            language: displayName.language,
            display_name: displayName.display_name,
          }),
        ) || placeholderProblem.problem_difficulty;

      const detailedProblem: IProblem = {
        id: problemPayload.problem_id,
        problem_difficulty: mappedDifficulty,
        details: [
          {
            language: displayDetails.language,
            title: displayDetails.title,
            background: displayDetails.background || '',
            statement: displayDetails.statement || '',
            input_format: displayDetails.input_format || '',
            output_format: displayDetails.output_format || '',
            note: displayDetails.note || '',
          },
        ],
        examples: Array.isArray(latestVersion.examples)
          ? latestVersion.examples
          : [],
        is_submitted: true,
        created_at: new Date(problemPayload.created_at || Date.now()),
        updated_at: new Date(problemPayload.updated_at || Date.now()),
        author: problemPayload.creator?.username || 'Unknown',
        status: normalizeProblemStatus(problemPayload.status),
      };

      setSelectedProblemDetail(detailedProblem);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load problem details',
      );
    } finally {
      setLoadingProblemDetailId(null);
    }
  };

  const handleExportContest = () => {
    if (!selectedContest) return;
    const payload = {
      contest: selectedContest,
      problems: assignedProblems.map((problem) => ({
        problem_id: problem.problem_id,
        title: problem.title,
        difficulty: problem.difficulty,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedContest.title
      .replace(/\s+/g, '-')
      .toLowerCase()}-contest.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const problemRequirementText =
    selectedContest &&
    t('contestManager.problemRequirement', {
      min: selectedContest.min_problem_count,
      max: selectedContest.max_problem_count,
      count: assignedProblems.length,
      defaultValue: '{{min}}-{{max}} problems (currently {{count}})',
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t('contestManager.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('contestManager.description')}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            {t('contestManager.refresh')}
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {t('contestManager.createContest')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('contestManager.contestList')}
          </h2>
          {loading ? (
            <div className="text-slate-400">{t('common.loading')}</div>
          ) : contests.length === 0 ? (
            <div className="text-slate-400">
              {t('contestManager.noContests')}
            </div>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {contests.map((contest) => (
                <li key={contest.contest_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedContestId(contest.contest_id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      contest.contest_id === selectedContestId
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-medium truncate">{contest.title}</div>
                    <div className="text-xs text-slate-300">
                      {new Date(contest.deadline_datetime).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 lg:col-span-2">
          {selectedContest ? (
            <>
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedContest.title}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {problemRequirementText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportContest}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 ml-auto"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  {t('contestManager.exportJson')}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">
                      {t('contestManager.assignedProblems')}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {assignedProblems.length}
                    </span>
                  </div>
                  {assignedProblems.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t('contestManager.noAssigned')}
                    </p>
                  ) : (
                    <ul className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                      {assignedProblems.map((problem) => (
                        <li
                          key={problem.problem_id}
                          className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            handleViewProblemDetails(problem.problem_id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleViewProblemDetails(problem.problem_id);
                            }
                          }}
                        >
                          <div className="flex-1 text-left">
                            <div className="text-white font-medium">
                              {problem.title}
                            </div>
                            <div className="text-xs text-slate-400 uppercase flex items-center gap-2">
                              {problem.difficulty}
                              {loadingProblemDetailId ===
                                problem.problem_id && (
                                <span className="text-[10px] lowercase text-slate-300">
                                  {t('common.loading')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveProblem(problem.problem_id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 text-sm disabled:opacity-50"
                            disabled={removingProblemId === problem.problem_id}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            {removingProblemId === problem.problem_id
                              ? t('common.loading')
                              : t('contestManager.removeProblem')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">
                      {t('contestManager.availableProblems')}
                    </h3>
                  </div>
                  <div className="mb-3 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={problemSearch}
                      onChange={(e) => setProblemSearch(e.target.value)}
                      className="w-full rounded-md border-0 bg-slate-700 py-2 pl-9 pr-3 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                      placeholder={t('contestManager.searchAvailable')}
                    />
                  </div>
                  {availableProblems.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t('contestManager.noAvailable')}
                    </p>
                  ) : (
                    <ul className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                      {availableProblems.map((problem) => (
                        <li
                          key={problem.problem_id}
                          className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-white font-medium">
                              {problem.title}
                            </div>
                            <div className="text-xs text-slate-400 uppercase">
                              {problem.difficulty}
                            </div>
                          </div>
                          {problem.assignedContestId ===
                          selectedContest.contest_id ? (
                            <span className="text-xs text-green-400 flex items-center">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Assigned
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAssignProblem(problem.problem_id)
                              }
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-sm disabled:opacity-50"
                              disabled={
                                assigningProblemId === problem.problem_id
                              }
                            >
                              <DocumentPlusIcon className="w-4 h-4 mr-1" />
                              {assigningProblemId === problem.problem_id
                                ? t('common.loading')
                                : t('contestManager.importProblem')}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ExclamationTriangleIcon className="w-8 h-8 mb-2" />
              {t('contestManager.selectContest')}
            </div>
          )}
        </div>
      </div>

      {showContestModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-medium text-white">
                {t('contestManager.modal.title')}
              </h2>
              <button
                onClick={() => setShowContestModal(false)}
                className="text-slate-400 hover:text-slate-200"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('contestManager.modal.name')}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={contestForm.title}
                  onChange={(e) =>
                    setContestForm({ ...contestForm, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('contestManager.modal.description')}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={contestForm.description}
                  onChange={(e) =>
                    setContestForm({
                      ...contestForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {t('contestManager.modal.min')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={contestForm.min_problem_count}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        min_problem_count: Math.max(1, Number(e.target.value)),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {t('contestManager.modal.max')}
                  </label>
                  <input
                    type="number"
                    min={contestForm.min_problem_count}
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={contestForm.max_problem_count}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        max_problem_count: Math.max(
                          contestForm.min_problem_count,
                          Number(e.target.value),
                        ),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('contestManager.modal.deadline')}
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={contestForm.deadline_datetime}
                  onChange={(e) =>
                    setContestForm({
                      ...contestForm,
                      deadline_datetime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowContestModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  type="button"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateContest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  type="button"
                  disabled={isSubmittingContest}
                >
                  {isSubmittingContest ? (
                    t('common.loading')
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 inline mr-1" />
                      {t('contestManager.modal.submit')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProblemDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                {t('contestManager.problemDetailModalTitle', {
                  defaultValue: 'Problem details',
                })}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedProblemDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <ProblemComponent problem={selectedProblemDetail} />
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProblemDetail(null)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestManagerPage;
