import {
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Problem, { IProblem } from '../../components/Problem';

const ProblemBank = () => {
  const { t } = useTranslation();
  // TODO: Fetch problems from API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [problems, setProblems] = useState<IProblem[]>([
    {
      id: '001',
      problem_difficulty: [{ language: 'en', display_name: 'Medium' }],
      details: [
        {
          language: 'en',
          title: 'Two Sum',
          background:
            'This problem tests your ability to use hash maps efficiently.',
          statement:
            'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
          input_format:
            'First line contains an integer `n` (2 ≤ n ≤ 10^4) — the length of the array.\nSecond line contains `n` integers `nums[i]` (-10^9 ≤ nums[i] ≤ 10^9).\nThird line contains a single integer `target` (-10^9 ≤ target ≤ 10^9).',
          output_format:
            'Return the indices of the two numbers that add up to the target, as an array of two integers, in increasing order.',
          note: 'The solution must run in O(n) time complexity.',
        },
      ],
      examples: [
        {
          input: '4\n2 7 11 15\n9',
          output: '0 1',
        },
        {
          input: '3\n3 2 4\n6',
          output: '1 2',
        },
      ],
      is_submitted: true,
      created_at: new Date('2025-04-22'),
      updated_at: new Date('2025-04-22'),
      author: 'Bob Johnson',
      status: 'pending',
    },
  ]);

  const [selectedProblemIds, setSelectedProblemIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedProblem, setSelectedProblem] = useState<IProblem | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

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

  const handleExport = () => {
    const problemsToExport = problems.filter((p) =>
      selectedProblemIds.has(p.id),
    );

    if (problemsToExport.length === 0) {
      alert(t('problemBank.alertSelectAtLeastOne'));
      return;
    }

    let dataToExport;

    if (exportFormat === 'json') {
      dataToExport = JSON.stringify(problemsToExport, null, 2);
    }

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
  };

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
                onClick={() => setSelectedProblem(problem)}
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
