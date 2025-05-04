import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface Submission {
  id: string;
  title: string;
  submittedAt: string;
  status: string;
}

const submissions: Submission[] = [
  {
    id: 'bbb',
    title: 'Problem 1: Two Sum',
    submittedAt: '2025-04-22',
    status: 'Submitted',
  },
  {
    id: 'ccc',
    title: 'Problem 2: Binary Tree Inorder Traversal',
    submittedAt: '2025-04-21',
    status: 'Pending',
  },
  // ...additional submissions
];

const Submissions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Submission | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSubmissions = submissions.filter((submission) =>
    submission.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSort = (column: keyof Submission) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort submissions based on current sort column and direction
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (!sortColumn) return 0;

    const valueA = a[sortColumn];
    const valueB = b[sortColumn];

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper to render sort indicator
  const renderSortIndicator = (column: keyof Submission) => {
    if (sortColumn !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-medium text-white">Submissions</h2>
        <input
          type="text"
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {filteredSubmissions.length === 0 ? (
          <p className="text-slate-400">No submissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  {/* Sortable column headers */}
                  {(['id', 'title', 'submittedAt', 'status'] as const).map(
                    (column) => (
                      <th
                        key={column}
                        className="px-6 py-3 text-left text-sm font-medium text-white"
                      >
                        <button
                          className="flex items-center cursor-pointer focus:outline-none group"
                          onClick={() => handleSort(column)}
                          type="button"
                        >
                          <span className="capitalize">
                            {column === 'submittedAt' ? 'Submitted At' : column}
                          </span>
                          <span
                            className={`ml-1 ${sortColumn === column ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                          >
                            {renderSortIndicator(column)}
                            {sortColumn !== column && (
                              <span className="text-xs">↕</span>
                            )}
                          </span>
                        </button>
                      </th>
                    ),
                  )}
                  <th className="px-6 py-3 text-left text-sm font-medium text-white">
                    Modify
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-white">
                    Chat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800">
                {sortedSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {submission.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {submission.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {submission.submittedAt}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {submission.status}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="px-3 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        type="button"
                      >
                        Modify
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/chat/${submission.id}`}
                        className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-300"
                      >
                        Chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;
