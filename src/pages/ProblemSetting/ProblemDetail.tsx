import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EditorRef, MilkdownEditorWrapper } from '../../components/Editor';
import { API_BASE_URL } from '../../config';
import { Problem } from './types';

interface DisplayName {
  language: string;
  display_name: string;
}

interface ProblemDifficulty {
  problem_difficulty_id: string;
  display_names: DisplayName[];
  color?: string;
}

interface ProblemDifficultiesResponse {
  problem_difficulties: ProblemDifficulty[];
}

interface ProblemFormProps {
  problem: Problem | null;
  isReadOnly?: boolean; // Add isReadOnly prop
  onSave: (problem: Problem) => void;
  onSubmit?: (problem: Problem) => void; // New callback for submit
  onCancel: () => void;
  onChange?: () => void;
}

type SampleRow = {
  id: string;
  input: string;
  output: string;
};

const ProblemDetail = ({
  problem,
  isReadOnly = false,
  onSave,
  onSubmit,
  onCancel,
}: ProblemFormProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>(problem?.details.title || '');
  const [language, setLanguage] = useState<string>(
    problem?.details.language || 'en-US',
  );
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const background_ref = useRef<EditorRef>(null);
  const statement_ref = useRef<EditorRef>(null);
  const input_format_ref = useRef<EditorRef>(null);
  const output_format_ref = useRef<EditorRef>(null);
  const note_ref = useRef<EditorRef>(null);

  const createSampleRow = useCallback(
    (sample?: { input?: string; output?: string } | null): SampleRow => ({
      id: crypto.randomUUID(),
      input: sample?.input ?? '',
      output: sample?.output ?? '',
    }),
    [],
  );

  const normalizeSamples = useCallback(
    (source?: Array<{ input: string; output: string }> | null): SampleRow[] => {
      if (!Array.isArray(source) || source.length === 0) {
        return [createSampleRow()];
      }
      return source.map((sample) => createSampleRow(sample));
    },
    [createSampleRow],
  );

  const [samples, setSamples] = useState<SampleRow[]>(() => {
    if (problem?.versions && problem.versions.length > 0) {
      const firstVersion = problem.versions[0];
      return normalizeSamples(
        (firstVersion?.examples as Array<{ input: string; output: string }>) ||
          [],
      );
    }
    return normalizeSamples(problem?.examples || []);
  });

  const [difficulty, setDifficulty] = useState<string>(
    problem?.problem_difficulty_id || '',
  );
  const [contest, setContest] = useState<string>(
    problem?.target_contest_id || '',
  );

  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
  const [difficulties, setDifficulties] = useState<ProblemDifficulty[]>([]);
  const [isLoadingDifficulties, setIsLoadingDifficulties] =
    useState<boolean>(false);
  const [errorLoadingDifficulties, setErrorLoadingDifficulties] =
    useState<string>('');

  useEffect(() => {
    // When selectedVersionIndex or problem changes, populate fields from that version
    if (problem?.versions && problem.versions.length > 0) {
      const version = problem.versions[selectedVersionIndex];
      if (version) {
        const enDetails =
          Array.isArray(version.details) && version.details.length > 0
            ? version.details.find((d) => d.language === 'en-US') ||
              version.details[0]
            : undefined;

        if (enDetails) {
          setTitle(enDetails.title || '');
          setLanguage(enDetails.language || 'en-US');
          // Update editors via refs by setting defaultValue prop is not possible after mount,
          // but we can set samples and difficulty/contest fields that are plain inputs
          setSamples(
            normalizeSamples(
              (version.examples as Array<{ input: string; output: string }>) ||
                [],
            ),
          );
          setDifficulty(
            version.problem_difficulty?.problem_difficulty_id || '',
          );
        }
      }
    } else {
      // No versions: fall back to problem props
      setTitle(problem?.details.title || '');
      setLanguage(problem?.details.language || 'en-US');
      setSamples(
        normalizeSamples(
          (problem?.examples as Array<{ input: string; output: string }>) || [],
        ),
      );
      setDifficulty(problem?.problem_difficulty_id || '');
    }
  }, [problem, selectedVersionIndex, normalizeSamples]);

  // Fetch difficulties on mount
  useEffect(() => {
    const fetchDifficulties = async () => {
      setIsLoadingDifficulties(true);
      setErrorLoadingDifficulties('');

      try {
        const response = await fetch(`${API_BASE_URL}/problem-difficulties`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load problem difficulties');
        }

        const data: ProblemDifficultiesResponse = await response.json();
        setDifficulties(data.problem_difficulties || []);

        // If no difficulty is selected and we have difficulties, select the first one
        if (
          !difficulty &&
          data.problem_difficulties &&
          data.problem_difficulties.length > 0
        ) {
          setDifficulty(data.problem_difficulties[0].problem_difficulty_id);
        }
      } catch (error) {
        console.error('Error loading problem difficulties:', error);
        setErrorLoadingDifficulties(
          error instanceof Error
            ? error.message
            : 'Failed to load problem difficulties',
        );
      } finally {
        setIsLoadingDifficulties(false);
      }
    };

    fetchDifficulties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    onCancel();
  };

  const handleSubmit = () => {
    setSubmitDisabled(true);
    const current_problem: Problem = {
      problem_draft_id: problem?.problem_draft_id || '',
      submitted_problem_id: problem?.submitted_problem_id,
      details: {
        language,
        title,
        background: background_ref.current?.getContent() || '',
        statement: statement_ref.current?.getContent() || '',
        input_format: input_format_ref.current?.getContent() || '',
        output_format: output_format_ref.current?.getContent() || '',
        note: note_ref.current?.getContent() || '',
      },
      examples: samples.map(({ input, output }) => ({ input, output })),
      problem_difficulty_id: difficulty,
      is_submitted: false,
      target_contest_id: contest,
      comments: problem?.comments || [],
      created_at: problem?.created_at || new Date().toLocaleString(),
      updated_at: new Date().toLocaleString(),
    };
    onSave(current_problem);
    setSubmitDisabled(false);
  };

  const handleSubmitForReview = () => {
    if (!onSubmit) return;

    setSubmitDisabled(true);
    const current_problem: Problem = {
      problem_draft_id: problem?.problem_draft_id || '',
      submitted_problem_id: problem?.submitted_problem_id,
      details: {
        language,
        title,
        background: background_ref.current?.getContent() || '',
        statement: statement_ref.current?.getContent() || '',
        input_format: input_format_ref.current?.getContent() || '',
        output_format: output_format_ref.current?.getContent() || '',
        note: note_ref.current?.getContent() || '',
      },
      examples: samples.map(({ input, output }) => ({ input, output })),
      problem_difficulty_id: difficulty,
      is_submitted: true,
      target_contest_id: contest,
      comments: problem?.comments || [],
      created_at: problem?.created_at || new Date().toLocaleString(),
      updated_at: new Date().toLocaleString(),
    };
    onSubmit(current_problem);
    setSubmitDisabled(false);
  };

  const addSample = () => {
    setSamples((prev) => [...prev, createSampleRow()]);
  };

  const removeSample = (index: number) => {
    setSamples((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateSample = (
    index: number,
    field: 'input' | 'output',
    value: string,
  ) => {
    setSamples((prev) =>
      prev.map((sample, idx) =>
        idx === index ? { ...sample, [field]: value } : sample,
      ),
    );
  };

  const getDifficultyName = (id: string): string => {
    const found = difficulties.find((d) => d.problem_difficulty_id === id);

    if (!found) return id;

    const userLang = language;
    const displayName = found.display_names.find(
      (dn) => dn.language === userLang,
    );

    if (!displayName) {
      const englishName = found.display_names.find(
        (dn) => dn.language === 'en-US',
      );
      return englishName
        ? englishName.display_name
        : found.display_names[0]?.display_name || id;
    }

    return displayName.display_name;
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-6 bg-slate-800/50 border-b border-slate-700">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isReadOnly ? 'View Problem' : 'Problem Detail'}
        </h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Version Selector */}
          {problem?.versions && problem.versions.length > 1 && (
            <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Versions
              </label>
              <select
                value={selectedVersionIndex}
                onChange={(e) =>
                  setSelectedVersionIndex(Number(e.target.value))
                }
                className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isReadOnly}
              >
                {problem.versions.map((v, idx) => (
                  <option key={v.version_id || idx} value={idx}>
                    {v.created_at ? `${v.created_at}` : `Version ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
                  placeholder="Enter problem title"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Language
                </label>
                <select
                  id="language"
                  className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  defaultValue={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="mb-8 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Problem Description
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Background
              </label>
              <MilkdownEditorWrapper
                ref={background_ref}
                defaultValue={problem?.details.background}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Statement
              </label>
              <MilkdownEditorWrapper
                ref={statement_ref}
                defaultValue={problem?.details.statement}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Input Format
              </label>
              <MilkdownEditorWrapper
                ref={input_format_ref}
                defaultValue={problem?.details.input_format}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Output Format
              </label>
              <MilkdownEditorWrapper
                ref={output_format_ref}
                defaultValue={problem?.details.output_format}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Note
              </label>
              <MilkdownEditorWrapper
                ref={note_ref}
                defaultValue={problem?.details.note}
              />
            </div>
          </div>

          {/* Test Samples */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                Test Samples
              </h2>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addSample}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-900/20 border border-emerald-700/50 rounded-lg hover:bg-emerald-900/40 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Sample
                </button>
              )}
            </div>

            <div className="space-y-4">
              {samples.map((sample, index) => (
                <div
                  key={sample.id}
                  className="border border-slate-700 rounded-lg p-5 bg-slate-800/50 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold text-base">
                      Sample #{index + 1}
                    </h3>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeSample(index)}
                        disabled={samples.length === 1}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          samples.length === 1
                            ? 'text-gray-500 cursor-not-allowed bg-slate-800'
                            : 'text-red-300 bg-red-900/20 border border-red-700/50 hover:bg-red-900/40'
                        }`}
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Input
                      </label>
                      <textarea
                        value={sample.input}
                        onChange={(e) =>
                          updateSample(index, 'input', e.target.value)
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 font-mono text-sm"
                        rows={5}
                        placeholder="Enter input..."
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Output
                      </label>
                      <textarea
                        value={sample.output}
                        onChange={(e) =>
                          updateSample(index, 'output', e.target.value)
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 font-mono text-sm"
                        rows={5}
                        placeholder="Enter output..."
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
              Additional Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="problem_difficulty_id"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Problem Difficulty
                </label>
                {isLoadingDifficulties ? (
                  <div className="w-full bg-slate-700 text-gray-400 px-4 py-2.5 border border-slate-600 rounded-lg">
                    Loading difficulties...
                  </div>
                ) : errorLoadingDifficulties ? (
                  <div className="w-full bg-red-900/20 text-red-300 px-4 py-2.5 border border-red-700/50 rounded-lg">
                    {errorLoadingDifficulties}
                  </div>
                ) : (
                  <select
                    id="problem_difficulty_id"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isReadOnly}
                  >
                    {difficulties.length === 0 ? (
                      <option value="">No difficulties available</option>
                    ) : (
                      difficulties.map((d) => (
                        <option
                          key={d.problem_difficulty_id}
                          value={d.problem_difficulty_id}
                        >
                          {getDifficultyName(d.problem_difficulty_id)}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
              <div>
                <label
                  htmlFor="target_contest_id"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Target Contest ID
                </label>
                <input
                  type="text"
                  id="target_contest_id"
                  value={contest}
                  onChange={(e) => setContest(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
                  placeholder="Enter target contest ID"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
            >
              {isReadOnly ? t('problemDetail.back') : 'Cancel'}
            </button>
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitDisabled || isLoadingDifficulties}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {problem?.submitted_problem_id
                    ? 'Save Edit'
                    : 'Save as Draft'}
                </button>
                {onSubmit && !problem?.submitted_problem_id && (
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={submitDisabled || isLoadingDifficulties}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                    Submit for Review
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
