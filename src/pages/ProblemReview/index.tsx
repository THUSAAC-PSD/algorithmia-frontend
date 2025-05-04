import { ArrowsUpDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IProblem } from '../../components/Problem';

const ProblemReview = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const mockProblems: IProblem[] = [
        {
          id: 'prob-1',
          details: [
            {
              language: 'en',
              title: 'Binary Tree Maximum Path Sum',
              background: '',
              statement:
                'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Find the maximum path sum.',
              input_format: '',
              output_format: '',
              note: '',
            },
          ],
          problem_difficulty: [{ language: 'en', display_name: 'Hard' }],
          examples: [],
          is_submitted: true,
          created_at: new Date('2025-04-28'),
          updated_at: new Date('2025-04-28'),
          author: 'John Doe',
          status: 'pending',
        },
        {
          id: 'prob-2',
          details: [
            {
              language: 'en',
              title: 'Merge K Sorted Lists',
              background: '',
              statement:
                'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.',
              input_format: '',
              output_format: '',
              note: '',
            },
          ],
          problem_difficulty: [{ language: 'en', display_name: 'Medium' }],
          examples: [],
          is_submitted: true,
          created_at: new Date('2025-04-30'),
          updated_at: new Date('2025-04-30'),
          author: 'Alice Smith',
          status: 'pending',
        },
        {
          id: 'prob-3',
          details: [
            {
              language: 'en',
              title: 'Word Search II',
              background: '',
              statement:
                'Given an m x n board of characters and a list of strings words, return all words on the board.',
              input_format: '',
              output_format: '',
              note: '',
            },
          ],
          problem_difficulty: [{ language: 'en', display_name: 'Hard' }],
          examples: [],
          is_submitted: true,
          created_at: new Date('2025-05-01'),
          updated_at: new Date('2025-05-01'),
          author: 'Bob Johnson',
          status: 'pending',
        },
        {
          id: 'prob-4',
          details: [
            {
              language: 'en',
              title: 'Median of Two Sorted Arrays',
              background: '',
              statement:
                'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.',
              input_format: '',
              output_format: '',
              note: '',
            },
          ],
          problem_difficulty: [{ language: 'en', display_name: 'Hard' }],
          examples: [],
          is_submitted: true,
          created_at: new Date('2025-04-29'),
          updated_at: new Date('2025-04-29'),
          author: 'Carol Williams',
          status: 'pending',
        },
      ];
      setProblems(mockProblems);
      setLoading(false);
    }, 800);
  }, []);

  // Filter and sort problems
  const filteredAndSortedProblems = problems
    .filter((problem) => {
      const title = problem.details[0]?.title || '';
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (problem.author?.toLowerCase() || '').includes(
          searchTerm.toLowerCase(),
        );
      const matchesStatus =
        filterStatus === 'all' || problem.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      return sortOrder === 'newest'
        ? b.created_at.getTime() - a.created_at.getTime()
        : a.created_at.getTime() - b.created_at.getTime();
    });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  // Get status badge
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Rejected
          </span>
        );
      case 'needs_changes':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            Needs Changes
          </span>
        );
      default:
        return null;
    }
  };

  // Navigate to problem detail page
  const handleProblemClick = (problemId: string) => {
    navigate(`/problemreview/${problemId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-medium text-white">Problem Review</h2>
        <div className="flex space-x-4">
          <button
            onClick={toggleSortOrder}
            className="flex items-center px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none hover:bg-slate-600 transition-colors"
            title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
            type="button"
          >
            <ArrowsUpDownIcon className="w-5 h-5 mr-2" />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_changes">Needs Changes</option>
          </select>
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredAndSortedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-xl">No problems found for review</p>
            <p className="mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => handleProblemClick(problem.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-white">
                          {problem.details[0]?.title || 'Untitled Problem'}
                        </h3>
                        <span className="ml-3">
                          {getStatusBadge(problem.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-400 flex items-center space-x-4">
                        <span>Author: {problem.author || 'Unknown'}</span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1 inline" />
                          Submitted on {problem.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                      {problem.problem_difficulty[0]?.display_name || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemReview;
