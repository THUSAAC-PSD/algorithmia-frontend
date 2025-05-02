import {
  ArrowsUpDownIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Problem {
  id: string;
  title: string;
  author: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  description?: string;
}

const ProblemVerification = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: 'aaa',
      title: 'Two Sum',
      author: 'John Doe',
      submittedAt: '2025-05-01',
      status: 'pending',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    },
    {
      id: 'bbb',
      title: 'Binary Tree Level Order Traversal',
      author: 'Jane Smith',
      submittedAt: '2025-04-30',
      status: 'needs_changes',
      description:
        "Given the root of a binary tree, return the level order traversal of its nodes' values.",
    },
    {
      id: 'ccc',
      title: 'Longest Palindromic Substring',
      author: 'Alex Johnson',
      submittedAt: '2025-04-29',
      status: 'pending',
      description:
        'Given a string s, return the longest palindromic substring in s.',
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredAndSortedProblems = problems
    .filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || problem.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return sortOrder === 'newest'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const handleStatusChange = (
    problemId: string,
    newStatus: Problem['status'],
  ) => {
    setProblems(
      problems.map((problem) =>
        problem.id === problemId ? { ...problem, status: newStatus } : problem,
      ),
    );
    // TODO: Send status change to server
  };

  const getStatusBadge = (status: Problem['status']) => {
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

  const submitFeedback = () => {
    // TODO: Implement feedback submission logic
    handleStatusChange(activeTabId!, 'needs_changes');
    setActiveTabId(null);
  };

  const handleChatRedirect = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${problemId}`);
  };

  const handleProblemClick = (problemId: string) => {
    navigate(`/problemverification/${problemId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-medium text-white">
          Problem Verification
        </h2>
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
        {filteredAndSortedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-xl">No problems found for verification</p>
            <p className="mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
                onClick={() => handleProblemClick(problem.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-white">
                          {problem.title}
                        </h3>
                        <span className="ml-3">
                          {getStatusBadge(problem.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-400 flex items-center space-x-4">
                        <span>Author: {problem.author}</span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1 inline" />
                          Submitted on {problem.submittedAt}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleChatRedirect(problem.id, e)}
                        className="p-2 rounded-full hover:bg-indigo-500/10 text-indigo-400"
                        title="Open Chat"
                        type="button"
                      >
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {activeTabId === problem.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Problem Description
                      </h4>
                      <div className="bg-slate-900 p-4 rounded-lg text-slate-300">
                        {problem.description || 'No description provided.'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Feedback
                      </h4>
                      <textarea
                        placeholder="Enter your feedback or comments here..."
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={4}
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        type="button"
                        onClick={() => setActiveTabId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        type="button"
                        onClick={submitFeedback}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemVerification;
