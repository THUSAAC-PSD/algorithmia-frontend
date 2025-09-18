import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Problem, { IProblem } from '../../components/Problem';

// Mock interface for tester users
interface Tester {
  user_id: string;
  username: string;
}

const ProblemReviewDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [selectedTester, setSelectedTester] = useState<string>('');
  const [assignedTesters, setAssignedTesters] = useState<string[]>([]);
  const [availableTesters, setAvailableTesters] = useState<Tester[]>([]);
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
        const response = await fetch(`/api/problems/${id}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message || 'Failed to load problem details',
          );
        }

        const data = await response.json();
        setAssignedTesters(
          data.problem.testers.map((tester: Tester) => tester.user_id) || [],
        );
        const latestVersion = data.problem.versions[0]; // Assuming versions are sorted with newest first

        // Get the English details or fallback to first available
        const detailsObj =
          Array.isArray(latestVersion.details) &&
          latestVersion.details.length > 0
            ? latestVersion.details.find(
                (d: { language: string }) => d.language === 'en-US',
              ) || latestVersion.details[0]
            : {
                language: 'en-US',
                title: '',
                background: '',
                statement: '',
                input_format: '',
                output_format: '',
                note: '',
              };

        // Transform problem_difficulty to match IProblem format
        const difficultyObj = latestVersion.problem_difficulty;
        const mappedDifficulty = difficultyObj?.display_names?.map(
          (d: { language: string; display_name: string }) => ({
            language: d.language,
            display_name: d.display_name,
          }),
        ) || [{ language: 'en-US', display_name: 'Unknown' }];

        // Convert to our internal IProblem format
        const convertedProblem: IProblem = {
          id: data.problem.problem_id,
          problem_difficulty: mappedDifficulty,
          details: [
            {
              language: detailsObj.language,
              title: detailsObj.title,
              background: detailsObj.background || '',
              statement: detailsObj.statement || '',
              input_format: detailsObj.input_format || '',
              output_format: detailsObj.output_format || '',
              note: detailsObj.note || '',
            },
          ],
          examples: Array.isArray(latestVersion.examples)
            ? latestVersion.examples
            : [],
          is_submitted: true,
          created_at: new Date(data.problem.created_at || Date.now()),
          updated_at: new Date(data.problem.updated_at || Date.now()),
          author: data.problem.creator?.username || 'Unknown',
          status: data.problem.status || 'pending_review',
        };
        setProblem(convertedProblem);

        try {
          const testersResponse = await fetch('/api/testers', {
            method: 'GET',
            mode: 'cors',
            headers: {
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          });

          if (testersResponse.ok) {
            const data = await testersResponse.json();
            console.log(data);
            const testersData = data.testers || [];
            const mappedTesters: Tester[] = Array.isArray(testersData)
              ? testersData.map((item: Tester) => ({
                  user_id: item.user_id,
                  username: item.username,
                }))
              : [];

            if (mappedTesters.length > 0) {
              setAvailableTesters(mappedTesters);
            } else {
              throw new Error('No testers found');
            }
          } else {
            throw new Error('Failed to fetch testers');
          }
        } catch (error) {
          console.error('Error fetching testers:', error);
          setAvailableTesters([]);
        }
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

    if (decision === 'approve' && assignedTesters.length === 0) {
      setNotification({
        message: 'Please assign at least one tester',
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

      const assign_testers = await fetch(`/api/problems/${id}/testers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
        body: JSON.stringify({
          problem_id: id,
          tester_ids: assignedTesters,
        }),
      });
      if (!assign_testers.ok) {
        throw new Error(
          (await assign_testers.json()).message || 'Failed to assign testers',
        );
      }

      const response = await fetch(`/api/problems/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          comment: decisionComment,
        }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || 'Failed to submit decision',
        );
      }

      // Navigate back to problem review list
      navigate('/problemreview', {
        state: {
          notification: `Problem successfully ${decision === 'approve' ? 'accepted' : 'rejected'}`,
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

  // Handle marking a problem as completed
  const handleMarkAsCompleted = async () => {
    try {
      // Show processing notification
      setNotification({
        message: 'Marking problem as completed...',
        type: 'info',
      });

      const response = await fetch(`/api/problems/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message ||
            'Failed to mark problem as completed',
        );
      }

      // Navigate back to problem review list
      navigate('/problemreview', {
        state: {
          notification: 'Problem successfully marked as completed',
          notificationType: 'success',
        },
      });
    } catch (error) {
      console.error('Error marking problem as completed:', error);
      setNotification({
        message: 'Failed to mark problem as completed. Please try again.',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center bg-slate-900">
        <div className="text-indigo-400 text-xl">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex w-full items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">Problem not found</div>
      </div>
    );
  }

  return (
    <div className="flex w-full bg-slate-900 overflow-auto">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded shadow-lg flex items-center space-x-3
          ${notification.type === 'success' ? 'bg-green-700 text-green-100' : ''}
          ${notification.type === 'error' ? 'bg-red-700 text-red-100' : ''}
          ${notification.type === 'info' ? 'bg-blue-700 text-blue-100' : ''}
        `}
        >
          <span>{notification.message}</span>
          <button
            className="ml-2 text-white hover:text-slate-200"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
            type="button"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 flex-1">
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
                  decision === 'approve'
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => setDecision('approve')}
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

          {decision === 'approve' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Assign Tester(s)
              </h3>
              <div className="flex items-center mb-4">
                <select
                  className="flex-1 rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={selectedTester}
                  onChange={(e) => setSelectedTester(e.target.value)}
                >
                  <option value="">-- Select a tester --</option>
                  {availableTesters.map((tester) => (
                    <option key={tester.user_id} value={tester.user_id}>
                      {tester.username}
                    </option>
                  ))}
                </select>
                <button
                  className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  type="button"
                  onClick={() => {
                    if (
                      selectedTester &&
                      !assignedTesters.includes(selectedTester)
                    ) {
                      setAssignedTesters([...assignedTesters, selectedTester]);
                    }
                    setSelectedTester('');
                  }}
                >
                  Add
                </button>
              </div>
              {assignedTesters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedTesters.map((testerId) => {
                    const tester = availableTesters.find(
                      (t) => t.user_id === testerId,
                    );
                    return (
                      <div
                        key={testerId}
                        className="flex items-center bg-slate-800 text-slate-300 px-3 py-1 rounded-full"
                      >
                        <span>{tester ? tester.username : testerId}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignedTesters(
                              assignedTesters.filter((id) => id !== testerId),
                            )
                          }
                          className="ml-2 text-red-500 hover:text-red-400"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {problem && problem.status === 'approve' && (
              <button
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                onClick={handleMarkAsCompleted}
                type="button"
              >
                <div className="flex items-center">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Mark as Completed
                </div>
              </button>
            )}
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
