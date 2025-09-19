import {
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Problem, { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config'; // added

const ProblemBank = () => {
  const { t } = useTranslation();

  const [problems, setProblems] = useState<IProblem[]>([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedProblem, setSelectedProblem] = useState<IProblem | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchProblems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/problems`, {
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
          const transformedProblems = Array.isArray(data?.problems)
            ? data.problems.map(
                (problem: {
                  problem_id: string;
                  title: Array<{ language: string; title: string }>;
                  status: string;
                  creator?: { user_id: string; username: string };
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
                    status: problem.status || 'pending',
                  };
                },
              )
            : [];
          setProblems(transformedProblems);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
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

  // Fetch full problem details when a problem is clicked
  const handleProblemClick = async (problem: IProblem) => {
    setSelectedProblem(problem); // First set with placeholder data for immediate display

    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problem.id}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || 'Failed to load problem details',
        );
      }

      const data = await response.json();

      // Extract details from the latest version
      const latestVersion = data.problem.versions[0]; // Assuming versions are sorted with newest first

      // Get the English details or fallback to first available
      const detailsObj =
        Array.isArray(latestVersion.details) && latestVersion.details.length > 0
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

      // Transform problem_difficulty to match IProblem format
      const difficultyObj = latestVersion.problem_difficulty;
      const mappedDifficulty = difficultyObj?.display_names?.map(
        (d: { language: string; display_name: string }) => ({
          language: d.language,
          display_name: d.display_name,
        }),
      ) || [{ language: 'en-US', display_name: 'Unknown' }];

      // Convert to our internal IProblem format with full details
      const updatedProblem: IProblem = {
        id: data.problem.problem_id,
        problem_difficulty: mappedDifficulty,
        details: [
          {
            language: detailsObj.language,
            title: detailsObj.title,
            background: detailsObj.background || '',
            statement: detailsObj.statement || '',
            input_format: detailsObj.input_format || '',
            output_format: detailsObj.output_format || '',
            note: detailsObj.note || '',
          },
        ],
        examples: Array.isArray(latestVersion.examples)
          ? latestVersion.examples
          : [],
        is_submitted: true,
        created_at: new Date(data.problem.created_at || Date.now()),
        updated_at: new Date(data.problem.updated_at || Date.now()),
        author: data.problem.creator?.username || 'Unknown',
        status: data.problem.status || 'pending',
      };

      // Update the selected problem with full details
      setSelectedProblem(updatedProblem);

      // Also update the problem in the problems list with the full details
      setProblems(
        problems.map((p) => (p.id === updatedProblem.id ? updatedProblem : p)),
      );
    } catch (error) {
      console.error('Error fetching problem details:', error);
      // Keep the placeholder data if detail fetch fails
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const filteredProblems = problems
    .filter((problem) => {
      const title = problem.details[0]?.title || '';
      return title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      return sortOrder === 'newest'
        ? b.created_at.getTime() - a.created_at.getTime()
        : a.created_at.getTime() - b.created_at.getTime();
    });

  const getDifficultyBadge = (problem: IProblem) => {
    const difficultyName = problem.problem_difficulty[0]?.display_name || '';

    switch (difficultyName) {
      case 'Easy':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            {t('problemBank.easy')}
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {t('problemBank.medium')}
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            {t('problemBank.hard')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
            {difficultyName || t('problemBank.unknown')}
          </span>
        );
    }
  };

  const toggleProblemSelection = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();

    const newSelectedProblems = new Set(selectedProblemIds);
    if (newSelectedProblems.has(problemId)) {
      newSelectedProblems.delete(problemId);
    } else {
      newSelectedProblems.add(problemId);
    }

    setSelectedProblemIds(newSelectedProblems);
  };

  const selectAllProblems = () => {
    const allIds = filteredProblems.map((p) => p.id);
    setSelectedProblemIds(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedProblemIds(new Set());
  };

  const handleExport = async () => {
    const selectedProblems = problems.filter((p) =>
      selectedProblemIds.has(p.id),
    );
    if (selectedProblems.length === 0) {
      alert(t('problemBank.alertSelectAtLeastOne'));
      return;
    }

    try {
      // Fetch detailed data for each selected problem
      const detailedProblems = await Promise.all(
        selectedProblems.map(async (problem) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/problems/${problem.id}`,
              {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'ngrok-skip-browser-warning': 'abc',
                },
                credentials: 'include',
              },
            );

            if (!response.ok) {
              throw new Error(
                (await response.json()).message ||
                  'Failed to load problem details',
              );
            }

            const data = await response.json();
            const latestVersion = data.problem.versions[0]; // Assuming newest first

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

            // Transform problem_difficulty to match IProblem format
            const difficultyObj = latestVersion.problem_difficulty;
            const mappedDifficulty = difficultyObj?.display_names?.map(
              (d: { language: string; display_name: string }) => ({
                language: d.language,
                display_name: d.display_name,
              }),
            ) || [{ language: 'en-US', display_name: 'Unknown' }];

            // Convert to our internal IProblem format with full details
            const updatedProblem: IProblem = {
              id: data.problem.problem_id,
              problem_difficulty: mappedDifficulty,
              details: [
                {
                  language: detailsObj.language,
                  title: detailsObj.title,
                  background: detailsObj.background || '',
                  statement: detailsObj.statement || '',
                  input_format: detailsObj.input_format || '',
                  output_format: detailsObj.output_format || '',
                  note: detailsObj.note || '',
                },
              ],
              examples: Array.isArray(latestVersion.examples)
                ? latestVersion.examples
                : [],
              is_submitted: true,
              created_at: new Date(data.problem.created_at || Date.now()),
              updated_at: new Date(data.problem.updated_at || Date.now()),
              author: data.problem.creator?.username || 'Unknown',
              status: data.problem.status || 'pending',
            };
            return updatedProblem;
          } catch (error) {
            console.error(
              `Error fetching details for problem ${problem.id}:`,
              error,
            );
            // Return the original problem if detailed fetch fails
            return problem;
          }
        }),
      );

      // Prepare export data
      let dataToExport;
      if (exportFormat === 'json') {
        dataToExport = JSON.stringify(detailedProblems, null, 2);
      }

      // Create and trigger the export file
      const blob = new Blob([dataToExport || ''], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `problem-bank-export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting detailed problems:', error);
      alert(t('problemBank.exportError') || 'Failed to export problems');
    }
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
      {/* Header with search, sort, and multi-select controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="relative rounded-md w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-slate-500"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 bg-slate-800 py-2 pl-10 pr-3 text-slate-300 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder={t('problemBank.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-4">
          {selectedProblemIds.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">
                {t('problemBank.selectedCount', {
                  count: selectedProblemIds.size,
                })}
              </span>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                type="button"
              >
                {t('problemBank.clearSelection')}
              </button>
            </div>
          )}

          <button
            onClick={toggleSortOrder}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm"
            type="button"
          >
            <ArrowsUpDownIcon className="w-4 h-4 mr-1" />
            {sortOrder === 'newest'
              ? t('problemBank.newestFirst')
              : t('problemBank.oldestFirst')}
          </button>

          <button
            onClick={selectAllProblems}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm"
            type="button"
          >
            {t('problemBank.selectAll')}
          </button>

          <button
            onClick={() => setShowExportOptions(true)}
            className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
            disabled={selectedProblemIds.size === 0}
            type="button"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            {t('problemBank.exportSelected')}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {filteredProblems.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            {t('problemBank.noProblemsFound')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className={`bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors cursor-pointer ${
                  selectedProblemIds.has(problem.id)
                    ? 'border border-indigo-500'
                    : ''
                }`}
                onClick={() => handleProblemClick(problem)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 w-5 h-5 rounded flex items-center justify-center ${
                          selectedProblemIds.has(problem.id)
                            ? 'bg-indigo-500 text-white'
                            : 'border border-slate-600 text-transparent'
                        }`}
                        onClick={(e) => toggleProblemSelection(e, problem.id)}
                      >
                        <CheckIcon className="w-3 h-3" />
                      </div>

                      <h3 className="text-white text-lg font-medium mb-1">
                        {problem.details[0]?.title ||
                          t('problemBank.untitledProblem')}
                      </h3>
                    </div>
                    <div className="flex space-x-3 mt-2 ml-8">
                      {getDifficultyBadge(problem)}
                      <span className="text-slate-400 text-sm flex items-center">
                        {t('problemBank.created')}:{' '}
                        {problem.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-medium text-white">
                  {t('problemBank.problemDetails')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400"
                type="button"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <Problem problem={selectedProblem} />
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedProblem(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                type="button"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-96 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-medium text-white">
                {t('problemBank.exportHeader', {
                  count: selectedProblemIds.size,
                })}
              </h3>
              <button
                onClick={() => setShowExportOptions(false)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400"
                type="button"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  {t('problemBank.exportFormat')}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                    />
                    <span className="ml-2 text-slate-300">JSON</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  type="button"
                >
                  {t('problemBank.export')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemBank;
