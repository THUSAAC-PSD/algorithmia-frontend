import { useState } from 'react';

import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';
import { Problem, ViewType } from './types';

const ProblemSetting = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);

  // Sample data
  const [problems, setProblems] = useState<Problem[]>([
    {
      problem_draft_id: '114514',
      details: {
        language: 'en-US',
        title: 'A+B Problem',
        background: 'A+B',
        statement: 'B+A',
        input_format: 'A',
        output_format: 'B',
        note: 'This is a note',
      },
      examples: [{ input: '1 2', output: '3' }],
      problem_difficulty_id: 'easy',
      is_submitted: true,
      target_contest_id: 'contest_1',
      comments: ['This is the first comment', 'This is the second comment'],
      created_at: '2025-03-20',
      updated_at: '2025-04-20',
    },
  ]);

  const handleDeleteProblem = (id: string) => {
    // TODO: Add confirmation dialog
    // TODO: Request to delete from the server
    setProblems(problems.filter((problem) => problem.problem_draft_id !== id));
  };

  const handleProblemClick = (id: string) => {
    // Find the selected problem and set the view to detail
    const problem = problems.find((p) => p.problem_draft_id === id);
    if (problem) {
      setCurrentProblem(problem);
      setCurrentView('detail');
    }
  };

  const handleAddNewProblem = () => {
    // Switch to new problem view
    setCurrentProblem(null);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentProblem(null);
  };

  return (
    <div className="p-6 h-full bg-slate-900">
      {currentView === 'list' && (
        <ProblemList
          problems={problems}
          onProblemClick={handleProblemClick}
          onDeleteProblem={handleDeleteProblem}
          onAddNewProblem={handleAddNewProblem}
        />
      )}

      {currentView === 'detail' && (
        <ProblemDetail
          problem={currentProblem}
          onSave={(problem) => {
            if (currentProblem) {
              setProblems(
                problems.map((p) =>
                  p.problem_draft_id === problem.problem_draft_id ? problem : p,
                ),
              );
            } else {
              setProblems([...problems, problem]);
            }
            // TODO: upload to backend
            new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
              handleBackToList(),
            );
          }}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ProblemSetting;
