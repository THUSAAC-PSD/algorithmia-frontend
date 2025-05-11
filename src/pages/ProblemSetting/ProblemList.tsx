import { useTranslation } from 'react-i18next';

import { Problem } from './types';

interface ProblemListProps {
  problems: Problem[];
  onProblemClick: (id: string) => void;
  onDeleteProblem: (id: string) => void;
  onSubmitProblem: (id: string) => void;
  onAddNewProblem: () => void;
  onNavigateToChat: (id: string) => void;
  searchTerm: string;
  sortColumn: keyof Problem | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof Problem) => void;
  renderSortIndicator: (column: keyof Problem) => React.ReactNode;
}

const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  onProblemClick,
  onDeleteProblem,
  onSubmitProblem,
  onNavigateToChat,
  sortColumn,
  onSort,
  renderSortIndicator,
}) => {
  const { t } = useTranslation();

  // Define sortable columns
  const sortableColumns: Array<{
    key: keyof Problem;
    label: string;
    accessor: (problem: Problem) => string;
  }> = [
    {
      key: 'details',
      label: t('problemList.title'),
      accessor: (p) => p.details.title,
    },
    {
      key: 'created_at',
      label: t('problemList.createdAt'),
      accessor: (p) => p.created_at,
    },
    {
      key: 'updated_at',
      label: t('problemList.updatedAt'),
      accessor: (p) => p.updated_at,
    },
    {
      key: 'is_submitted',
      label: t('problemList.status'),
      accessor: (p) =>
        p.is_submitted ? t('problemList.submitted') : t('problemList.draft'),
    },
  ];

  return (
    <div className="overflow-x-auto p-6">
      {problems.length === 0 ? (
        <p className="text-slate-400">{t('problemList.noProblem')}</p>
      ) : (
        <div className="shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                {sortableColumns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-6 py-3 text-left text-sm font-medium text-white"
                  >
                    <button
                      className="flex items-center cursor-pointer focus:outline-none group"
                      onClick={() => onSort(column.key)}
                      type="button"
                    >
                      <span>{column.label}</span>
                      <span
                        className={`ml-1 ${
                          sortColumn === column.key
                            ? 'text-indigo-400'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {renderSortIndicator(column.key)}
                        {sortColumn !== column.key && (
                          <span className="text-xs">↕</span>
                        )}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-sm font-medium text-white">
                  {t('problemList.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-800">
              {problems.map((problem) => (
                <tr
                  key={problem.problem_draft_id}
                  className="hover:bg-slate-700"
                >
                  <td
                    className="px-6 py-4 text-sm text-white font-medium cursor-pointer"
                    onClick={() => onProblemClick(problem.problem_draft_id)}
                  >
                    {problem.details.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {problem.created_at}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {problem.updated_at}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        problem.is_submitted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {problem.is_submitted
                        ? t('problemList.submitted')
                        : t('problemList.draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex space-x-2">
                    {!problem.is_submitted && (
                      <button
                        onClick={() =>
                          onSubmitProblem(problem.problem_draft_id)
                        }
                        className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded text-white text-xs"
                        type="button"
                      >
                        {t('problemList.submit')}
                      </button>
                    )}
                    <button
                      onClick={() => onProblemClick(problem.problem_draft_id)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs"
                      type="button"
                    >
                      {t('problemList.modify')}
                    </button>
                    <button
                      onClick={() => onDeleteProblem(problem.problem_draft_id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs"
                      type="button"
                    >
                      {t('problemList.delete')}
                    </button>
                    {problem.is_submitted && (
                      <button
                        onClick={() =>
                          onNavigateToChat(problem.problem_draft_id)
                        }
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white text-xs"
                        type="button"
                      >
                        {t('problemList.chat')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProblemList;
