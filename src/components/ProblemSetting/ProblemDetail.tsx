import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { MilkdownEditorWrapper } from '../Editor';
import { Problem } from './types';
// import toast, { Toaster } from 'react-hot-toast';

interface ProblemFormProps {
  problem: Problem | null;
  onSave: (problem: Problem) => void;
  onCancel: () => void;
}

const ProblemDetail = ({ problem, onSave, onCancel }: ProblemFormProps) => {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(problem);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentProblem) {
      setCurrentProblem({
        ...currentProblem,
        content: {
          ...currentProblem.content,
          title: e.target.value,
        },
      });
    }
  };

  // const handleBackgroundChange = (
  //   e: React.ChangeEvent<HTMLTextAreaElement>,
  // ) => {
  //   if (currentProblem) {
  //     setCurrentProblem({
  //       ...currentProblem,
  //       content: {
  //         ...currentProblem.content,
  //         background: e.target.value,
  //       },
  //     });
  //   }
  // };

  const handleSubmit = () => {
    // TODO: check if problem is valid
    onSave(currentProblem as Problem);
  };

  return (
    <>
      {/* <Toaster
        position="top-center"
        reverseOrder={false}
      /> */}
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={() => {
            // TODO: if exists unsaved changes, ask for confirmation
            // if (true) {
            //   // pop a toast
            //   toast("You have unsaved changes", {
            //     duration: 2000,
            //     // TODO: Error icon
            //   });
            // } else {
            //   onCancel();
            // }
          }}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Problem Detail</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-lg font-bold text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={currentProblem?.content.title || ''}
            onChange={handleTitleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter problem title"
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-lg font-bold text-gray-700 mb-1"
          >
            Background
          </label>
          {/* <textarea
            id="content"
            value={currentProblem?.content.background || ''}
            onChange={handleBackgroundChange}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter problem description"
          /> */}
          <MilkdownEditorWrapper />
        </div>
        {/* TODO: 1. more milkdown editors 2. allow uploading file */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Problem
          </button>
        </div>
      </div>
    </>
  );
};

export default ProblemDetail;
