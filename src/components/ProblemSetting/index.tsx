import { useState } from 'react';

import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';
import { Problem, ProblemContent, ViewType } from './types';

const ProblemSetting = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);

  // Sample data
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: '1',
      timestamp: '2025-03-20',
      content: { title: 'A+B Problem', background: 'A+B' } as ProblemContent,
    },
  ]);

  const handleDeleteProblem = (id: string) => {
    // TODO: Add confirmation dialog
    // TODO: Request to delete from the server
    setProblems(problems.filter((problem) => problem.id !== id));
  };

  const handleProblemClick = (id: string) => {
    // Find the selected problem and set the view to detail
    const problem = problems.find((p) => p.id === id);
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
    <div className="p-6 h-full bg-gray-50">
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
              // TODO: Update existing problem
              setProblems(
                problems.map((p) => (p.id === problem.id ? problem : p)),
              );
            } else {
              // TODO: Create new problem
            }
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
};

export default ProblemSetting;
