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
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

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

  // Fetch competition data
  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchCompetition = async () => {
      setLoading(true);
      try {
        // Mock API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock competition data
        const mockCompetition: Competition = {
          contest_id: id || 'unknown',
          title: 'Algorithmic Challenge 2025',
          description: 'Annual competition focused on algorithm optimization',
          min_problem_count: 5,
          max_problem_count: 10,
          deadline_datetime: new Date(
            new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date(
            new Date().getTime() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          problems: [
            {
              problem_id: 'prob-1',
              title: 'Two Sum',
              difficulty: 'Easy',
              is_assigned: true,
            },
            {
              problem_id: 'prob-2',
              title: 'Binary Tree Maximum Path Sum',
              difficulty: 'Hard',
              is_assigned: true,
            },
          ],
        };

        setCompetition(mockCompetition);

        setAvailableProblems([
          {
            problem_id: 'prob-1',
            title: 'Two Sum',
            difficulty: 'Easy',
            is_assigned: true,
          },
          {
            problem_id: 'prob-2',
            title: 'Binary Tree Maximum Path Sum',
            difficulty: 'Hard',
            is_assigned: true,
          },
          {
            problem_id: 'prob-3',
            title: 'Longest Substring Without Repeating Characters',
            difficulty: 'Medium',
            is_assigned: false,
          },
          {
            problem_id: 'prob-4',
            title: 'Median of Two Sorted Arrays',
            difficulty: 'Hard',
            is_assigned: false,
          },
          {
            problem_id: 'prob-5',
            title: 'Valid Parentheses',
            difficulty: 'Easy',
            is_assigned: false,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch competition:', error);
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

    // Remove problem from competition
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

  // Filter available problems for the modal
  const filteredProblems = availableProblems.filter(
    (problem) =>
      !problem.is_assigned &&
      (problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.difficulty.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-center text-slate-400">
          {t('competitions.loading')}
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-6">
        <div className="text-center text-red-400">
          {t('competitions.competitionNotFound')}
        </div>
      </div>
    );
  }

  const getProblemCountStatus = () => {
    const currentCount = competition.problems.length;
    const minCount = competition.min_problem_count;
    const maxCount = competition.max_problem_count;

    if (currentCount < minCount) {
      return {
        text: t('competitions.needMoreProblems', {
          current: currentCount,
          min: minCount,
          need_more_problems: minCount - currentCount,
        }),
        color: 'text-yellow-400',
      };
    } else if (currentCount > maxCount) {
      return {
        text: t('competitions.tooManyProblems', {
          current: currentCount,
          max: maxCount,
        }),
        color: 'text-red-400',
      };
    } else {
      return {
        text: t('competitions.problemCountOk', {
          current: currentCount,
          min: minCount,
          max: maxCount,
        }),
        color: 'text-green-400',
      };
    }
  };

  const problemCountStatus = getProblemCountStatus();

  // Generate markdown export
  const exportToMarkdown = () => {
    if (!competition) return;

    let markdown = `# ${competition.title}\n\n`;
    markdown += `**Contest ID:** ${competition.contest_id}\n`;
    markdown += `**Created:** ${formatDate(competition.created_at)}\n`;
    markdown += `**Deadline:** ${formatDate(competition.deadline_datetime)}\n`;
    markdown += `**Problem Requirement:** ${competition.min_problem_count} - ${competition.max_problem_count} problems\n\n`;
    markdown += `## Description\n\n${competition.description}\n\n`;

    markdown += `## Assigned Problems (${competition.problems.length})\n\n`;

    if (competition.problems.length === 0) {
      markdown += `No problems assigned yet.\n\n`;
    } else {
      markdown += `| Problem ID | Title | Difficulty |\n`;
      markdown += `| ---------- | ----- | ---------- |\n`;

      competition.problems.forEach((problem) => {
        markdown += `| ${problem.problem_id} | ${problem.title} | ${problem.difficulty} |\n`;
      });
      markdown += '\n';
    }

    // Create and download the markdown file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${competition.title.replace(/\s+/g, '-').toLowerCase()}-competition.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/competitions')}
          className="flex items-center text-slate-400 hover:text-white transition-colors mr-4"
          type="button"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          {t('competitions.backToList')}
        </button>
        <h1 className="text-2xl font-bold text-white">{competition.title}</h1>
        <button
          onClick={exportToMarkdown}
          className="flex items-center ml-auto px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          type="button"
          title={t('competitions.exportToMarkdown')}
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
          {t('competitions.export')}
        </button>
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
                  {competition.min_problem_count} -{' '}
                  {competition.max_problem_count} {t('competitions.problems')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">
                  {t('competitions.currentProblemCount')}
                </h3>
                <p className={problemCountStatus.color}>
                  {problemCountStatus.text}
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
  );
};

export default CompetitionDetail;
