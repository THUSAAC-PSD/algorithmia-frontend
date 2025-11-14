import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../../../config';

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
  const navigate = useNavigate();
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

  // Load competitions data from API
  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/contests`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch competitions');
        }

        const data = await response.json();
        if (data && Array.isArray(data.contests)) {
          setCompetitions(data.contests);
        } else {
          setCompetitions([]);
        }
      } catch (error) {
        console.error('Error fetching competitions:', error);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
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

  // Navigate to competition detail page
  const handleViewCompetition = (contestId: string) => {
    navigate(`/contestmanager/${contestId}`);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (contestId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    setCompetitionToDelete(contestId);
    setShowDeleteModal(true);
  };

  // Execute competition deletion
  const confirmDelete = async () => {
    if (competitionToDelete) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/contests/${competitionToDelete}`,
          {
            method: 'DELETE',
            headers: {
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw new Error('Failed to delete competition');
        }

        // Update local state after successful deletion
        setCompetitions(
          competitions.filter((c) => c.contest_id !== competitionToDelete),
        );
      } catch (error) {
        console.error('Error deleting competition:', error);
        // Could add error notification here
      }
    }
    setShowDeleteModal(false);
    setCompetitionToDelete(null);
  };

  // Handle competition save (create or update)
  const handleSaveCompetition = async () => {
    try {
      const deadlineDateObj = new Date(formData.deadline_datetime);
      deadlineDateObj.setHours(23, 59, 59);

      // Prepare the request body
      const competitionData = {
        title: formData.title,
        description: formData.description,
        min_problem_count: formData.min_problem_count,
        max_problem_count: formData.max_problem_count,
        deadline_datetime: deadlineDateObj.toISOString(),
      };

      let response;

      if (currentCompetition) {
        // Update existing competition
        response = await fetch(
          `${API_BASE_URL}/contests/${currentCompetition.contest_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
            body: JSON.stringify(competitionData),
          },
        );
      } else {
        // Create new competition
        response = await fetch(`${API_BASE_URL}/contests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify(competitionData),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Failed to ${currentCompetition ? 'update' : 'create'} competition`,
        );
      }

      // Refresh the competitions list
      const fetchResponse = await fetch(`${API_BASE_URL}/contests`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      });

      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        if (data && Array.isArray(data.contests)) {
          setCompetitions(data.contests);
        }
      }

      setShowCompetitionModal(false);
    } catch (error) {
      console.error('Error saving competition:', error);
      // You could add error notification here
    }
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

  // Helper to check if competition is expired
  const isExpired = (deadlineStr: string) => {
    return new Date(deadlineStr) < new Date();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {t('competitions.managementTitle')}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage all competition settings and deadlines
            </p>
          </div>

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
            className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 hover:scale-105"
            type="button"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {t('competitions.newCompetition')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-slate-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 bg-slate-800/50 py-3 pl-11 pr-4 text-slate-300 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 transition-all"
            placeholder={t('competitions.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Competitions Grid */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="text-slate-400">{t('competitions.loading')}</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-fadeIn">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
                  <DocumentTextIcon className="w-20 h-20 text-indigo-400/80" />
                </div>
              </div>
              <div className="text-center space-y-3 max-w-md">
                <h3 className="text-xl font-semibold text-white">
                  {searchTerm
                    ? t('competitions.noMatchingCompetitions')
                    : t('competitions.noCompetitionsYet')}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {searchTerm
                    ? t('competitions.tryDifferentSearch')
                    : t('competitions.createFirstCompetition')}
                </p>
              </div>
              {!searchTerm && (
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
                  className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 hover:scale-105 mt-4"
                  type="button"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  {t('competitions.createCompetition')}
                </button>
              )}
            </div>
          ) : (
            filteredCompetitions.map((competition) => {
              const expired = isExpired(competition.deadline_datetime);
              return (
                <div
                  key={competition.contest_id}
                  className="group bg-slate-800/50 hover:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                  onClick={() => handleViewCompetition(competition.contest_id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {competition.title}
                        </h3>
                        {expired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <ClockIcon className="w-3.5 h-3.5 mr-1" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                        {competition.description}
                      </p>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-slate-400">
                          <DocumentTextIcon className="w-4 h-4 mr-2 text-slate-500" />
                          <span>
                            {competition.min_problem_count} -{' '}
                            {competition.max_problem_count} problems
                          </span>
                        </div>
                        <div className="flex items-center text-slate-400">
                          <ClockIcon className="w-4 h-4 mr-2 text-slate-500" />
                          <span>
                            Due {formatDate(competition.deadline_datetime)}
                          </span>
                        </div>
                        <div className="flex items-center text-slate-400">
                          <span className="text-slate-500 mr-2">Created</span>
                          {formatDate(competition.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompetition(competition.contest_id);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title={t('competitions.viewCompetition')}
                        type="button"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCompetition(competition);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                        title={t('competitions.editCompetition')}
                        type="button"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) =>
                          handleDeleteClick(competition.contest_id, e)
                        }
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title={t('competitions.deleteCompetition')}
                        type="button"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Competition Modal */}
        {showCompetitionModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 animate-slideUp">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {currentCompetition
                      ? t('competitions.editCompetitionModalTitle', {
                          title: currentCompetition.title,
                        })
                      : t('competitions.createCompetitionModalTitle')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowCompetitionModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  type="button"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('competitions.form.title')}{' '}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-0 bg-slate-700/50 py-2.5 px-4 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder={t('competitions.form.titlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('competitions.form.description')}{' '}
                      <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border-0 bg-slate-700/50 py-2.5 px-4 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all resize-none"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder={t(
                        'competitions.form.descriptionPlaceholder',
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('competitions.form.minProblemCount')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border-0 bg-slate-700/50 py-2.5 px-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all"
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('competitions.form.maxProblemCount')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border-0 bg-slate-700/50 py-2.5 px-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all"
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('competitions.form.deadline')}{' '}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border-0 bg-slate-700/50 py-2.5 px-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all"
                      value={formData.deadline_datetime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deadline_datetime: e.target.value,
                        })
                      }
                    />
                    <p className="mt-2 text-xs text-slate-500 flex items-center">
                      <ClockIcon className="w-3.5 h-3.5 mr-1" />
                      {t('competitions.form.deadlineHelp')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-700">
                  <button
                    onClick={() => setShowCompetitionModal(false)}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    type="button"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveCompetition}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center transition-all shadow-lg hover:shadow-indigo-500/50"
                    type="button"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-red-500/20 animate-slideUp">
              <div className="px-6 py-5 flex items-center border-b border-slate-700 bg-gradient-to-r from-red-600/10 to-orange-600/10">
                <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {t('competitions.confirmDeletion')}
                </h2>
              </div>

              <div className="p-6">
                <p className="text-slate-300 leading-relaxed">
                  {t('competitions.deleteConfirmation', {
                    title: getTitleById(competitionToDelete || ''),
                  })}
                </p>
                <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400 flex items-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    type="button"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-red-500/50 flex items-center"
                    type="button"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {t('competitions.deleteCompetition')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionManagement;
