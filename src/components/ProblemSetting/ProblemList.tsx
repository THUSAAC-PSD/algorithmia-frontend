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
        <h1 className="text-3xl font-bold text-white">Problem List</h1>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={onAddNewProblem}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Problem</span>
        </button>
      </div>

      <div className="rounded-lg shadow overflow-hidden shadow-slate-800">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Last Modified
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {problems.map((problem) => (
              <tr
                key={problem.problem_draft_id}
                className="hover:bg-slate-700 cursor-pointer"
                onClick={() => onProblemClick(problem.problem_draft_id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {problem.details.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {problem.updated_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProblem(problem.problem_draft_id);
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
          <div className="text-center py-8 text-gray-400">
            No problems yet, please add a new problem
          </div>
        )}
      </div>
    </>
  );
};

export default ProblemList;
