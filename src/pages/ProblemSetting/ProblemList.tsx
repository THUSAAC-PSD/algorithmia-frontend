import { format, isToday, isYesterday } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { CombinedProblemListItem, ProblemType } from './types';

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      const match = timestamp.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
      if (match) {
        const [, datePart, timePart] = match;
        return `${datePart} ${timePart}`;
      }
      return timestamp;
    }

    if (isToday(date)) {
      return `Today, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'yyyy-MM-dd HH:mm');
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp; // Return original if formatting fails
  }
};

interface ProblemListProps {
  problems: CombinedProblemListItem[];
  onProblemClick: (id: string, type: ProblemType) => void;
  onDeleteProblem: (id: string, type: ProblemType) => void;
  onSubmitProblem: (id: string) => void;
  onAddNewProblem: () => void;
  onNavigateToChat: (id: string) => void;
  searchTerm: string;
  sortColumn: keyof CombinedProblemListItem | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof CombinedProblemListItem) => void;
  renderSortIndicator: (
    column: keyof CombinedProblemListItem,
  ) => React.ReactNode;
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
    key: keyof CombinedProblemListItem;
    label: string;
    accessor: (problem: CombinedProblemListItem) => string;
  }> = [
    {
      key: 'title',
      label: t('problemList.title'),
      accessor: (p) => p.title,
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
      key: 'status',
      label: t('problemList.status'),
      accessor: (p) => p.status,
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
                  key={`${problem.type}-${problem.id}`}
                  className="hover:bg-slate-700"
                >
                  <td
                    className="px-6 py-4 text-sm text-white font-medium cursor-pointer"
                    onClick={() => onProblemClick(problem.id, problem.type)}
                  >
                    {problem.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {formatTimestamp(problem.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {formatTimestamp(problem.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        problem.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : problem.status === 'submitted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {t(`problemList.${problem.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex space-x-2">
                    {(problem.status === 'draft' ||
                      problem.status === 'needs_revision') && (
                      <button
                        onClick={() => onSubmitProblem(problem.id)}
                        className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded text-white text-xs"
                        type="button"
                      >
                        {t('problemList.submit')}
                      </button>
                    )}
                    {problem.type === 'draft' && (
                      <>
                        <button
                          onClick={() =>
                            onProblemClick(problem.id, problem.type)
                          }
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs"
                          type="button"
                        >
                          {t('problemList.modify')}
                        </button>
                        <button
                          onClick={() =>
                            onDeleteProblem(problem.id, problem.type)
                          }
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs"
                          type="button"
                        >
                          {t('problemList.delete')}
                        </button>
                      </>
                    )}
                    {problem.type === 'published' && (
                      <button
                        onClick={() => onProblemClick(problem.id, problem.type)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs"
                        type="button"
                      >
                        {t('problemList.view')}
                      </button>
                    )}
                    {(problem.status === 'submitted' ||
                      problem.type === 'published') && (
                      <button
                        onClick={() => onNavigateToChat(problem.id)}
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
