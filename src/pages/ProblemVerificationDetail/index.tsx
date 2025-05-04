import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PencilIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Problem, { IProblem } from '../../components/Problem';

const ProblemVerificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<
    IProblem['status'] | null
  >(null);

  useEffect(() => {
    const fetchProblem = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // For now, we'll create mock data based on the IProblem interface
        const mockProblem: IProblem = {
          id: id || 'unknown',
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
        };

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProblem(mockProblem);
      } catch (error) {
        console.error('Error fetching problem:', error);
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  const handleStatusSelect = (status: IProblem['status'] | null) => {
    setSelectedStatus(status);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedStatus) {
      alert('Please select a status for this problem');
      return;
    }

    try {
      // TODO: Replace with actual API call
      console.log('Submitting feedback:', {
        problemId: id,
        status: selectedStatus,
        feedback: feedbackText,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate back to the problem verification page
      navigate('/problemverification', {
        state: {
          feedbackSubmitted: true,
          problemId: id,
          status: selectedStatus,
        },
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Handle error
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-indigo-400 text-xl">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">Problem not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/problemverification')}
              className="flex items-center text-slate-400 hover:text-white transition-colors mr-4"
              type="button"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Back to list
            </button>
            <h1 className="text-xl font-medium text-white">
              Problem Verification
            </h1>
          </div>

          {/* Chat Link Button */}
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            type="button"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Open Chat
          </button>
        </div>

        {/* Problem Component */}
        <Problem problem={problem} />

        {/* Feedback Section */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Provide Feedback
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Status Decision
            </h3>
            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedStatus === 'approved'
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => handleStatusSelect('approved')}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Approve
              </button>
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedStatus === 'rejected'
                    ? 'bg-red-500/20 text-red-300 border-red-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => handleStatusSelect('rejected')}
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Reject
              </button>
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedStatus === 'needs_changes'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => handleStatusSelect('needs_changes')}
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Request Changes
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Feedback Comments
            </h3>
            <textarea
              className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={6}
              placeholder="Provide detailed feedback for the problem author..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              onClick={handleSubmitFeedback}
              type="button"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemVerificationDetail;
