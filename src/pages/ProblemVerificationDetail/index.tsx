import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { EditorRef, MilkdownEditorWrapper } from '../../components/Editor';
import Problem, { IProblem } from '../../components/Problem';
import { API_BASE_URL } from '../../config'; // added
import {
  normalizeProblemStatus,
  ProblemStatus,
} from '../../types/problem-status';

const ProblemVerificationDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ProblemStatus | null>(
    null,
  );
  const editorRef = useRef<EditorRef>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      setIsLoading(true);
      try {
        // Fetch the problem details from the API
        const response = await fetch(`${API_BASE_URL}/problems/${id}`, {
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

        const latestVersion = data.problem.versions[0];

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
          status: normalizeProblemStatus(data.problem.status),
        };

        setProblem(convertedProblem);
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  const handleStatusSelect = (status: ProblemStatus | null) => {
    setSelectedStatus(status);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedStatus) {
      toast.error(t('problemVerificationDetail.selectStatusAlert'));
      return;
    }

    // Get content from the editor if it's being used
    const editorContent = editorRef.current?.getContent() || '';

    try {
      // Send feedback and status update to the server
      const response = await fetch(
        `${API_BASE_URL}/problems/${id}/test-results`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({
            comment: editorContent,
            status:
              selectedStatus === 'awaiting_final_check' ? 'passed' : 'failed',
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || 'Failed to submit feedback',
        );
      }

      // Update the problem status locally
      if (problem) {
        setProblem({
          ...problem,
          status: selectedStatus,
        });
      }

      // Show success message and navigate back
      toast.success(t('problemVerificationDetail.feedbackSubmitted'));
      navigate('/problemverification');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit feedback',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center bg-slate-900">
        <div className="text-indigo-400 text-xl">
          {t('problemVerificationDetail.loading')}
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex w-full items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">
          {t('problemVerificationDetail.notFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full bg-slate-900 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/problemverification')}
              className="flex items-center text-slate-400 hover:text-white transition-colors mr-4"
              type="button"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              {t('problemVerificationDetail.backToList')}
            </button>
            <h1 className="text-xl font-medium text-white">
              {t('problemVerificationDetail.title')}
            </h1>
          </div>

          {/* Chat Link Button */}
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            type="button"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            {t('problemVerificationDetail.openChat')}
          </button>
        </div>

        {/* Problem Component */}
        <Problem problem={problem} />

        {/* Feedback Section */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {t('problemVerificationDetail.provideFeedback')}
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t('problemVerificationDetail.statusDecision')}
            </h3>
            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedStatus === 'awaiting_final_check'
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => handleStatusSelect('awaiting_final_check')}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {t('problemVerificationDetail.approve')}
              </button>
              <button
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedStatus === 'testing_changes_requested'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                type="button"
                onClick={() => handleStatusSelect('testing_changes_requested')}
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                {t('problemVerificationDetail.requestChanges')}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t('problemVerificationDetail.feedbackComments')}
            </h3>
            <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
              <div className="prose prose-invert max-w-none">
                <MilkdownEditorWrapper ref={editorRef} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              onClick={handleSubmitFeedback}
              type="button"
            >
              {t('problemVerificationDetail.submitFeedback')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemVerificationDetail;
