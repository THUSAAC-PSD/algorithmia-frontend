import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import { EditorRef, MilkdownEditorWrapper } from '../../components/Editor';
import { Problem } from './types';

interface ProblemFormProps {
  problem: Problem | null;
  onSave: (problem: Problem) => void;
  onCancel: () => void;
}

const ProblemDetail = ({ problem, onSave, onCancel }: ProblemFormProps) => {
  const [title, setTitle] = useState<string>(problem?.details.title || '');

  const [language, setLanguage] = useState<string>(
    problem?.details.language || 'en-US',
  );
  const background_ref = useRef<EditorRef>(null);
  const statement_ref = useRef<EditorRef>(null);
  const input_format_ref = useRef<EditorRef>(null);
  const output_format_ref = useRef<EditorRef>(null);
  const note_ref = useRef<EditorRef>(null);

  const [samples, setSamples] = useState<
    Array<{ input: string; output: string }>
  >(problem?.examples || [{ input: '', output: '' }]);

  const [difficulty, setDifficulty] = useState<string>(
    problem?.problem_difficulty_id || '',
  );
  const [contest, setContest] = useState<string>(
    problem?.target_contest_id || '',
  );

  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);

  const handleCancel = () => {
    // TODO: confirmation required
    onCancel();
  };

  const handleSubmit = () => {
    setSubmitDisabled(true);
    const current_problem: Problem = {
      problem_draft_id: problem?.problem_draft_id || crypto.randomUUID(),
      details: {
        language,
        title,
        background: background_ref.current?.getContent() || '',
        statement: statement_ref.current?.getContent() || '',
        input_format: input_format_ref.current?.getContent() || '',
        output_format: output_format_ref.current?.getContent() || '',
        note: note_ref.current?.getContent() || '',
      },
      examples: samples,
      problem_difficulty_id: difficulty,
      is_submitted: false,
      target_contest_id: contest,
      comments: [],
      created_at: problem?.created_at || new Date().toLocaleString(),
      updated_at: new Date().toLocaleString(),
    };
    onSave(current_problem);
  };

  const addSample = () => {
    setSamples([...samples, { input: '', output: '' }]);
  };

  const removeSample = (index: number) => {
    if (samples.length > 1) {
      const newSamples = [...samples];
      newSamples.splice(index, 1);
      setSamples(newSamples);
    }
  };

  const updateSample = (
    index: number,
    field: 'input' | 'output',
    value: string,
  ) => {
    const newSamples = [...samples];
    newSamples[index][field] = value;
    setSamples(newSamples);
  };

  return (
    <>
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={handleCancel}
          className="mr-4 p-1 rounded-full hover:bg-slate-600"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-200" />
        </button>
        <h1 className="text-2xl font-bold text-white">Problem Detail</h1>
      </div>

      <div className="bg-gray rounded-lg shadow p-6 bg-slate-800 shadow-slate-800">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-lg font-bold text-white mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-white w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter problem title"
            />
          </div>
          <div>
            <label className="block text-lg font-bold text-white mb-1">
              Language
            </label>
            <select
              id="language"
              className="text-white w-full px-3 py-2.5 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              defaultValue={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="zh-CN" className="text-gray-400">
                中文
              </option>
              <option value="en-US" className="text-gray-400">
                English
              </option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-white mb-1 mt-6">
            Background
          </label>
          <MilkdownEditorWrapper
            ref={background_ref}
            defaultValue={problem?.details.background}
          />
          <label className="block text-lg font-bold text-white mb-1 mt-4">
            Statement
          </label>
          <MilkdownEditorWrapper
            ref={statement_ref}
            defaultValue={problem?.details.statement}
          />
          <label className="block text-lg font-bold text-white mb-1 mt-4">
            Input Format
          </label>
          <MilkdownEditorWrapper
            ref={input_format_ref}
            defaultValue={problem?.details.input_format}
          />
          <label className="block text-lg font-bold text-white mb-1 mt-4">
            Output Format
          </label>
          <MilkdownEditorWrapper
            ref={output_format_ref}
            defaultValue={problem?.details.output_format}
          />
          <label className="block text-lg font-bold text-white mb-1 mt-4">
            Note
          </label>
          <MilkdownEditorWrapper
            ref={note_ref}
            defaultValue={problem?.details.note}
          />

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-lg font-bold text-white">
                Samples
              </label>
              <button
                type="button"
                onClick={addSample}
                className="flex items-center px-3 py-1 text-green-300 rounded-md hover:bg-green-900"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Sample
              </button>
            </div>

            {samples.map((sample, index) => (
              <div
                key={index}
                className="border border-slate-600 rounded-md p-4 mb-4 bg-slate-800"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">
                    Sample #{index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeSample(index)}
                    disabled={samples.length === 1}
                    className={`flex items-center px-2 py-1 rounded-md ${
                      samples.length === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-400 hover:bg-red-900'
                    }`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-start gap-4 w-full">
                  <div className="w-1/2">
                    <label className="block text-md font-medium text-white mb-1">
                      Input
                    </label>
                    <textarea
                      value={sample.input}
                      onChange={(e) =>
                        updateSample(index, 'input', e.target.value)
                      }
                      className="text-white w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-md font-medium text-white mb-1">
                      Output
                    </label>
                    <textarea
                      value={sample.output}
                      onChange={(e) =>
                        updateSample(index, 'output', e.target.value)
                      }
                      className="text-white w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 mb-4">
          <div>
            <label className="block text-lg font-bold text-white mb-1">
              Problem Difficulty ID
            </label>
            <input
              type="text"
              id="problem_difficulty_id"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="text-white w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter difficulty ID"
            />
          </div>
          <div>
            <label className="block text-lg font-bold text-white mb-1">
              Target Contest ID
            </label>
            <input
              type="text"
              id="target_contest_id"
              value={contest}
              onChange={(e) => setContest(e.target.value)}
              className="text-white w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter target contest ID"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-white mt-6 mb-1">
            Comments
          </label>
          <div>
            {problem?.comments.map((comment, index) => (
              <div
                key={comment}
                className="border border-slate-600 rounded-md p-4 mb-2 bg-slate-800"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-semibold">
                    Comment #{index + 1}
                  </h3>
                </div>
                <p className="text-white">{comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-white hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            Save Problem
          </button>
        </div>
      </div>
    </>
  );
};

export default ProblemDetail;
