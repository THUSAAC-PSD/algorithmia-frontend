import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Competition {
  contest_id: string;
  title: string;
  description: string;
  min_problem_count: number;
  max_problem_count: number;
  deadline_datetime: string;
  created_at: string;
}

const CompetitionManagement = () => {
  const { t } = useTranslation();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [currentCompetition, setCurrentCompetition] =
    useState<Competition | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_problem_count: 1,
    max_problem_count: 10,
    deadline_datetime: '',
  });

  // Load mock data
  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const now = new Date();
      const mockCompetitions: Competition[] = [
        {
          contest_id: 'contest-1',
          title: 'Algorithmic Challenge 2025',
          description: 'Annual competition focused on algorithm optimization',
          min_problem_count: 5,
          max_problem_count: 10,
          deadline_datetime: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date(
            now.getTime() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          contest_id: 'contest-2',
          title: 'Weekly Code Sprint #42',
          description: 'Weekly competition with medium difficulty problems',
          min_problem_count: 3,
          max_problem_count: 5,
          deadline_datetime: new Date().toISOString(),
          created_at: new Date(
            now.getTime() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];
      setCompetitions(mockCompetitions);
      setLoading(false);
    }, 800);
  }, []);

  // Filter competitions based on search
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Handle competition edit
  const handleEditCompetition = (competition: Competition) => {
    setCurrentCompetition(competition);
    setFormData({
      title: competition.title,
      description: competition.description,
      min_problem_count: competition.min_problem_count,
      max_problem_count: competition.max_problem_count,
      deadline_datetime: new Date(competition.deadline_datetime)
        .toISOString()
        .split('T')[0],
    });
    setShowCompetitionModal(true);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (contestId: string) => {
    setCompetitionToDelete(contestId);
    setShowDeleteModal(true);
  };

  // Execute competition deletion
  const confirmDelete = () => {
    if (competitionToDelete) {
      setCompetitions(
        competitions.filter((c) => c.contest_id !== competitionToDelete),
      );
      // TODO: Replace with actual API call to delete competition
    }
    setShowDeleteModal(false);
    setCompetitionToDelete(null);
  };

  // Handle competition save (create or update)
  const handleSaveCompetition = () => {
    const deadlineDateObj = new Date(formData.deadline_datetime);
    deadlineDateObj.setHours(23, 59, 59);

    if (currentCompetition) {
      // Update existing competition
      setCompetitions(
        competitions.map((comp) =>
          comp.contest_id === currentCompetition.contest_id
            ? {
                ...comp,
                title: formData.title,
                description: formData.description,
                min_problem_count: formData.min_problem_count,
                max_problem_count: formData.max_problem_count,
                deadline_datetime: deadlineDateObj.toISOString(),
              }
            : comp,
        ),
      );
    } else {
      // Create new competition
      const newCompetition: Competition = {
        contest_id: `contest-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        min_problem_count: formData.min_problem_count,
        max_problem_count: formData.max_problem_count,
        deadline_datetime: deadlineDateObj.toISOString(),
        created_at: new Date().toISOString(),
      };
      setCompetitions([...competitions, newCompetition]);
    }

    setShowCompetitionModal(false);
  };

  // Get title by ID
  const getTitleById = (contestId: string) => {
    const competition = competitions.find((c) => c.contest_id === contestId);
    return competition
      ? competition.title
      : t('competitions.unknownCompetition');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          {t('competitions.managementTitle')}
        </h1>

        <button
          onClick={() => {
            setCurrentCompetition(null);
            setFormData({
              title: '',
              description: '',
              min_problem_count: 1,
              max_problem_count: 10,
              deadline_datetime: new Date().toISOString().split('T')[0],
            });
            setShowCompetitionModal(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          type="button"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {t('competitions.newCompetition')}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-slate-500"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 bg-slate-800 py-2.5 pl-10 pr-3 text-slate-300 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
            placeholder={t('competitions.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">{t('competitions.loading')}</div>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {t('competitions.noCompetitionsFound')}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.contestId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.details')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.problemCount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.deadline')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.createdAt')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('competitions.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCompetitions.map((competition) => (
                <tr
                  key={competition.contest_id}
                  className="hover:bg-slate-700/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {competition.contest_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-white">
                        {competition.title}
                      </div>
                      <div className="text-sm text-slate-400 line-clamp-1">
                        {competition.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {competition.min_problem_count} -{' '}
                    {competition.max_problem_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(competition.deadline_datetime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {formatDate(competition.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditCompetition(competition)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        title={t('competitions.editCompetition')}
                        type="button"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(competition.contest_id)
                        }
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        title={t('competitions.deleteCompetition')}
                        type="button"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Competition Modal */}
      {showCompetitionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-slate-800 rounded-lg max-w-2xl w-full overflow-hidden shadow-xl"
            style={{
              animation: 'scaleIn 0.2s ease-out forwards',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-medium text-white">
                {currentCompetition
                  ? t('competitions.editCompetitionModalTitle', {
                      title: currentCompetition.title,
                    })
                  : t('competitions.createCompetitionModalTitle')}
              </h2>
              <button
                onClick={() => setShowCompetitionModal(false)}
                className="text-slate-400 hover:text-slate-200"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {t('competitions.form.title')}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={t('competitions.form.titlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {t('competitions.form.description')}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t('competitions.form.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {t('competitions.form.minProblemCount')}
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                      value={formData.min_problem_count}
                      min={1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_problem_count: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {t('competitions.form.maxProblemCount')}
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                      value={formData.max_problem_count}
                      min={formData.min_problem_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_problem_count:
                            parseInt(e.target.value) ||
                            formData.min_problem_count,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {t('competitions.form.deadline')}
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={formData.deadline_datetime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deadline_datetime: e.target.value,
                      })
                    }
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {t('competitions.form.deadlineHelp')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCompetitionModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  type="button"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveCompetition}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                  type="button"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                  {currentCompetition
                    ? t('competitions.saveChanges')
                    : t('competitions.createCompetition')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          style={{
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
        >
          <div
            className="bg-slate-800 rounded-lg max-w-md w-full overflow-hidden shadow-xl"
            style={{
              animation: 'slideIn 0.3s ease-out forwards',
            }}
          >
            <div className="bg-red-500/10 px-6 py-4 flex items-center border-b border-slate-700">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
              <h2 className="text-lg font-medium text-white">
                {t('competitions.confirmDeletion')}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-slate-300">
                {t('competitions.deleteConfirmation', {
                  title: getTitleById(competitionToDelete || ''),
                })}
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  type="button"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  type="button"
                >
                  {t('competitions.deleteCompetition')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManagement;
