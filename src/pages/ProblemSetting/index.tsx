import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../config';
import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';
import { Problem, ViewType } from './types';

const ProblemSetting = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Problem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // Sample data
  const [problems, setProblems] = useState<Problem[]>([
    // {
    //   problem_draft_id: '114514',
    //   details: {
    //     language: 'en-US',
    //     title: 'A+B Problem',
    //     background: 'A+B',
    //     statement: 'B+A',
    //     input_format: 'A',
    //     output_format: 'B',
    //     note: 'This is a note',
    //   },
    //   examples: [{ input: '1 2', output: '3' }],
    //   problem_difficulty_id: 'easy',
    //   is_submitted: true,
    //   target_contest_id: 'contest_1',
    //   comments: ['This is the first comment', 'This is the second comment'],
    //   created_at: '2025-03-20',
    //   updated_at: '2025-04-20',
    // },
  ]);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchProblems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/problem-drafts`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message || 'Failed to load problems',
          );
        }

        const data = await response.json();
        if (isMounted) {
          setProblems(
            Array.isArray(data?.problem_drafts) ? data.problem_drafts : [],
          );
        }
      } catch {
        if (isMounted) {
          setProblems([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProblems();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Filter problems based on search term
  const filteredProblems = problems.filter((problem) =>
    problem.details.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Sort problems based on current sort column and direction
  const handleSort = (column: keyof Problem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Helper to render sort indicator
  const renderSortIndicator = (column: keyof Problem) => {
    if (sortColumn !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  const handleDeleteProblem = (id: string) => {
    // TODO: Add confirmation dialog
    // TODO: Request to delete from the server
    setProblems(problems.filter((problem) => problem.problem_draft_id !== id));
  };

  const handleSubmitProblem = (id: string) => {
    // TODO: Request to submit the problem
    setProblems(
      problems.map((problem) =>
        problem.problem_draft_id === id
          ? { ...problem, is_submitted: true }
          : problem,
      ),
    );
  };

  const handleProblemClick = (id: string) => {
    // Find the selected problem and set the view to detail
    const problem = problems.find((p) => p.problem_draft_id === id);
    if (problem) {
      setCurrentProblem(problem);
      setCurrentView('detail');
    }
  };

  const handleAddNewProblem = () => {
    // Switch to new problem view
    setCurrentProblem(null);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentProblem(null);
  };

  // Navigation to chat for a specific problem
  const handleNavigateToChat = (id: string) => {
    // TODO: Implement chat navigation
    console.log(`Navigate to chat for problem ${id}`);
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
          onSave={(problem) => {
            if (currentProblem) {
              setProblems(
                problems.map((p) =>
                  p.problem_draft_id === problem.problem_draft_id ? problem : p,
                ),
              );
            } else {
              setProblems([...problems, problem]);
            }
            // TODO: upload to backend
            new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
              handleBackToList(),
            );
          }}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ProblemSetting;
