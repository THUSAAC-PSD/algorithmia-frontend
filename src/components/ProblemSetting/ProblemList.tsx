import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

import { Problem } from './types';

interface ProblemListProps {
  problems: Problem[];
  onProblemClick: (id: string) => void;
  onDeleteProblem: (id: string) => void;
  onAddNewProblem: () => void;
}

const ProblemList = ({
  problems,
  onProblemClick,
  onDeleteProblem,
  onAddNewProblem,
}: ProblemListProps) => {
  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Problem List</h1>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={onAddNewProblem}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Problem</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Last Modified
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {problems.map((problem) => (
              <tr
                key={problem.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onProblemClick(problem.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {problem.content.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {problem.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProblem(problem.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {problems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No problems yet, please add a new problem
          </div>
        )}
      </div>
    </>
  );
};

export default ProblemList;
