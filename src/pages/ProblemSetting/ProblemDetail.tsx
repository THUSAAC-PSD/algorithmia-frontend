import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
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
  onCancel: () => void;
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

  const createSampleRow = (
    sample?: { input?: string; output?: string } | null,
  ): SampleRow => ({
    id: crypto.randomUUID(),
    input: sample?.input ?? '',
    output: sample?.output ?? '',
  });

  const normalizeSamples = (
    source?: Array<{ input: string; output: string }> | null,
  ): SampleRow[] => {
    if (!Array.isArray(source) || source.length === 0) {
      return [createSampleRow()];
    }
    return source.map((sample) => createSampleRow(sample));
  };

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
  }, [problem, selectedVersionIndex]);

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
      examples: samples.map(({ input, output }) => ({ input, output })),
      problem_difficulty_id: difficulty,
      is_submitted: false,
      target_contest_id: contest,
      comments: problem?.comments || [],
      created_at: problem?.created_at || new Date().toLocaleString(),
      updated_at: new Date().toLocaleString(),
    };
    onSave(current_problem);
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
    <div className="p-6 flex flex-col w-full overflow-y-auto">
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={handleCancel}
          className="mr-4 p-1 rounded-full hover:bg-slate-600"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-200" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isReadOnly ? 'View Problem' : 'Problem Detail'}
        </h1>
      </div>

      <div className="bg-gray rounded-lg shadow p-6 bg-slate-800 shadow-slate-800">
        {/* Title and Language */}
        {problem?.versions && problem.versions.length > 1 && (
          <div className="mb-4">
            <label className="block text-md font-medium text-white mb-1">
              Versions
            </label>
            <select
              value={selectedVersionIndex}
              onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
              className="text-white px-3 py-2 border border-slate-600 rounded-md"
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
              readOnly={isReadOnly}
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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

        {/* Problem description fields */}
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
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addSample}
                  className="flex items-center px-3 py-1 text-green-300 rounded-md hover:bg-green-900"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Sample
                </button>
              )}
            </div>

            {samples.map((sample, index) => (
              <div
                key={sample.id}
                className="border border-slate-600 rounded-md p-4 mb-4 bg-slate-800"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">
                    Sample #{index + 1}
                  </h3>
                  {!isReadOnly && (
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
                  )}
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
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
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
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
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
              Problem Difficulty
            </label>
            {isLoadingDifficulties ? (
              <div className="text-white opacity-70">
                Loading difficulties...
              </div>
            ) : errorLoadingDifficulties ? (
              <div className="text-red-400">{errorLoadingDifficulties}</div>
            ) : (
              <select
                id="problem_difficulty_id"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="text-white w-full px-3 py-2.5 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {!isReadOnly ? (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitDisabled || isLoadingDifficulties}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white disabled:opacity-50"
            >
              {t('problemDetail.save')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white ml-2"
          >
            {isReadOnly ? t('problemDetail.back') : t('problemDetail.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
