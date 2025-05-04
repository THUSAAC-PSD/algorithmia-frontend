import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Problem, { IProblem } from '../../components/Problem';

// Mock interface for reviewer users
interface Reviewer {
  user_id: string;
  username: string;
  email: string;
}

// Notification component
const Notification = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const bgColor =
    type === 'success'
      ? 'bg-green-500/20'
      : type === 'error'
        ? 'bg-red-500/20'
        : 'bg-blue-500/20';

  const textColor =
    type === 'success'
      ? 'text-green-300'
      : type === 'error'
        ? 'text-red-300'
        : 'text-blue-300';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 flex items-center ${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-slate-300 hover:text-white"
        type="button"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const ProblemReviewDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [decisionComment, setDecisionComment] = useState('');

  // Check for notification in location state when component mounts
  useEffect(() => {
    if (location.state?.notification) {
      setNotification({
        message: location.state.notification,
        type: location.state.notificationType || 'success',
      });

      // Clear the notification from location state to prevent it showing again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        const mockProblem: IProblem = {
          id: id || 'unknown',
          problem_difficulty: [{ language: 'en', display_name: 'Hard' }],
          details: [
            {
              language: 'en',
              title: 'Binary Tree Maximum Path Sum',
              background:
                'This problem tests your understanding of tree traversal and dynamic programming.',
              statement:
                "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\n\nThe path sum of a path is the sum of the node's values in the path.\n\nGiven the root of a binary tree, return the maximum path sum of any path.",
              input_format:
                'First line contains a serialized binary tree in level order traversal format.',
              output_format:
                'Return an integer representing the maximum path sum.',
              note: 'The number of nodes in the tree is in the range [1, 3 * 10^4].',
            },
          ],
          examples: [
            {
              input: '[1,2,3]',
              output: '6',
            },
            {
              input: '[-10,9,20,null,null,15,7]',
              output: '42',
            },
          ],
          is_submitted: true,
          created_at: new Date('2025-04-28'),
          updated_at: new Date('2025-04-28'),
          author: 'John Doe',
          status: 'pending',
        };

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProblem(mockProblem);

        // Fetch available reviewers (mock data)
        const mockReviewers: Reviewer[] = [
          { user_id: '1', username: 'Alex Johnson', email: 'alex@example.com' },
          { user_id: '2', username: 'Emma Wilson', email: 'emma@example.com' },
          {
            user_id: '3',
            username: 'Michael Brown',
            email: 'michael@example.com',
          },
          { user_id: '4', username: 'Sophia Lee', email: 'sophia@example.com' },
        ];
        setAvailableReviewers(mockReviewers);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setNotification({
          message: 'Failed to load problem data',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  // Handle submit decision
  const handleSubmitDecision = async () => {
    if (!decision) {
      setNotification({
        message: 'Please make a decision (Accept or Reject)',
        type: 'error',
      });
      return;
    }

    if (decision === 'reject' && !rejectionReason.trim()) {
      setNotification({
        message: 'Please provide a reason for rejection',
        type: 'error',
      });
      return;
    }

    if (decision === 'accept' && !selectedReviewer) {
      setNotification({
        message: 'Please select a reviewer',
        type: 'error',
      });
      return;
    }

    try {
      // Show processing notification
      setNotification({
        message: 'Processing your decision...',
        type: 'info',
      });

      // Simulate API call
      console.log('Submitting decision:', {
        problemId: id,
        decision,
        comment: decisionComment,
        rejectionReason: rejectionReason || null,
        reviewerId: selectedReviewer || null,
      });

      // Mock delay for API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back to problem review list
      navigate('/problemreview', {
        state: {
          notification: `Problem successfully ${decision === 'accept' ? 'accepted' : 'rejected'}`,
          notificationType: 'success',
        },
      });
    } catch (error) {
      console.error('Error submitting decision:', error);
      setNotification({
        message: 'Failed to submit decision. Please try again.',
        type: 'error',
      });
    }
  };

  const closeNotification = () => {
    setNotification(null);
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/problemreview')}
              className="flex items-center text-slate-400 hover:text-white transition-colors mr-4"
              type="button"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Back to list
            </button>
            <h1 className="text-xl font-medium text-white">Problem Review</h1>
          </div>
        </div>

        {/* Problem Component */}
        <Problem problem={problem} />

        {/* Decision Section */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Review Decision</h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Make Decision
            </h3>
            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  decision === 'accept'
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => setDecision('accept')}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Accept
              </button>
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  decision === 'reject'
                    ? 'bg-red-500/20 text-red-300 border-red-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => setDecision('reject')}
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Reject
              </button>
            </div>
          </div>

          {decision && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Review Comment
              </h3>
              <textarea
                className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Add any comments about your decision that will be visible to the author..."
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
              ></textarea>
            </div>
          )}

          {decision === 'accept' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Assign Reviewer
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Select Reviewer
                </label>
                <select
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                >
                  <option value="">-- Select a reviewer --</option>
                  {availableReviewers.map((reviewer) => (
                    <option key={reviewer.user_id} value={reviewer.user_id}>
                      {reviewer.username} ({reviewer.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {decision === 'reject' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Rejection Reason
              </h3>
              <textarea
                className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Provide a detailed reason for rejecting this problem..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              ></textarea>
              <div className="mt-2 text-xs text-slate-400">
                This reason will be used internally and not directly shared with
                the author.
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors ${
                !decision ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSubmitDecision}
              disabled={!decision}
              type="button"
            >
              Submit Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemReviewDetail;
