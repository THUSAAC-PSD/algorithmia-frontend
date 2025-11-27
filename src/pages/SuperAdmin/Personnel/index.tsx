import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../../config';

interface ApiUser {
  user_id: string;
  username: string;
  email: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface ApiRole {
  name: string;
  description?: string;
  is_super_admin?: boolean;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  roles: string[];
  created_at: Date;
  updated_at: Date;
}

interface FormState {
  username: string;
  email: string;
  roles: string[];
}

const transformApiUser = (user: ApiUser): User => ({
  user_id: user.user_id,
  username: user.username,
  email: user.email,
  roles: Array.isArray(user.roles) ? user.roles : [],
  created_at: user.created_at ? new Date(user.created_at) : new Date(),
  updated_at: user.updated_at ? new Date(user.updated_at) : new Date(),
});

const parseErrorResponse = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data === 'string') {
      return data;
    }
    if (data?.message) {
      return data.message;
    }
  } catch {
    // ignore JSON parse errors
  }
  return response.statusText || 'Unknown error';
};

const PersonnelManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(
    null,
  );
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    username: '',
    email: '',
    roles: [],
  });

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await parseErrorResponse(response));
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const normalizedUsers = Array.isArray(data?.users)
          ? (data.users as ApiUser[]).map(transformApiUser)
          : [];
        const normalizedRoles = Array.isArray(data?.roles)
          ? Array.from(
              new Set(
                (data.roles as ApiRole[])
                  .map((role) => role?.name)
                  .filter((name): name is string => Boolean(name)),
              ),
            ).sort()
          : [];

        setUsers(normalizedUsers);
        setAvailableRoles(normalizedRoles);
        setRoleFilter((prev) =>
          prev !== 'all' && !normalizedRoles.includes(prev) ? 'all' : prev,
        );
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching users:', error);
          toast.error(
            error instanceof Error ? error.message : 'Failed to load user list',
          );
          setUsers([]);
          setAvailableRoles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const availableRoleOptions = availableRoles.length > 0 ? availableRoles : [];

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      roles: [...user.roles],
    });
    setShowUserModal(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handlePasswordClick = (user: User) => {
    setPasswordTargetUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!passwordTargetUser) return;
    const { newPassword, confirmPassword } = passwordForm;
    if (
      !newPassword ||
      newPassword.length < 8 ||
      newPassword !== confirmPassword
    ) {
      toast.error(
        t(
          'personnel.password.errors.invalid',
          'Passwords must match and be at least 8 characters.',
        ),
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${passwordTargetUser.user_id}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success(
        t('personnel.password.success', {
          username: passwordTargetUser.username,
        }),
      );
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('personnel.password.errors.generic', 'Failed to reset password'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-300';
      case 'admin':
        return 'bg-purple-500/20 text-purple-300';
      case 'verifier':
      case 'reviewer':
        return 'bg-blue-500/20 text-blue-300';
      case 'setter':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'tester':
        return 'bg-indigo-500/20 text-indigo-300';
      case 'contest_manager':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getRoleLabel = (role: string) =>
    t(`personnel.roles.${role}`, role.replace(/_/g, ' '));

  const getUsernameById = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.username : t('personnel.unknownUser');
  };

  const closeEditModal = () => {
    setShowUserModal(false);
    setCurrentUser(null);
    setFormData({
      username: '',
      email: '',
      roles: [],
    });
    setIsSaving(false);
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(role);
      return {
        ...prev,
        roles: exists
          ? prev.roles.filter((r) => r !== role)
          : [...prev.roles, role],
      };
    });
  };

  const handleSaveUser = async () => {
    if (!currentUser) {
      return;
    }

    if (formData.roles.length === 0) {
      toast.error(t('personnel.roleSelectionHint'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${currentUser.user_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim(),
            roles: formData.roles,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      const data = await response.json();
      const updatedUser = transformApiUser(data.user);

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user,
        ),
      );

      toast.success(t('personnel.toast.updateSuccess'));
      closeEditModal();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'abc',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      setUsers((prev) => prev.filter((user) => user.user_id !== userToDelete));

      toast.success(t('personnel.toast.deleteSuccess'));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete user',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          {t('personnel.title')}
        </h1>
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
            placeholder={t('personnel.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="block w-full rounded-md border-0 bg-slate-800 py-2.5 pl-3 pr-8 text-slate-300 focus:ring-1 focus:ring-indigo-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t('personnel.filter.all')}</option>
            {availableRoleOptions.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">{t('personnel.loading')}</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {t('personnel.noUsersFound')}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('personnel.table.userId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('personnel.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('personnel.table.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('personnel.table.createdAt')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('personnel.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-slate-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length === 0 ? (
                        <span className="text-slate-400 text-sm">
                          {t('personnel.roles.user')}
                        </span>
                      ) : (
                        user.roles.map((role) => (
                          <span
                            key={`${user.user_id}-${role}`}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(role)}`}
                          >
                            {getRoleLabel(role)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.created_at.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handlePasswordClick(user)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        title={t('personnel.password.title', 'Reset password')}
                        type="button"
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        title={t('personnel.editUser')}
                        type="button"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.user_id)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        type="button"
                        title={t('personnel.deleteUser')}
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

      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-slate-800 rounded-lg max-w-lg w-full overflow-hidden shadow-xl transform transition-all duration-300 ease-out"
            style={{
              animation: 'scaleIn 0.2s ease-out forwards',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-medium text-white">
                {t('personnel.editUserModalTitle', {
                  username: currentUser?.username,
                })}
              </h2>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-200"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('personnel.form.username')}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('personnel.form.email')}
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('personnel.form.role')}
                </label>
                {availableRoleOptions.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {t('personnel.noRolesLoaded')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {availableRoleOptions.map((role) => (
                      <label
                        key={role}
                        className="inline-flex items-center text-slate-300 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mr-2 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                        />
                        {getRoleLabel(role)}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {t('personnel.roleSelectionHint')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  type="button"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={
                    isSaving ||
                    availableRoleOptions.length === 0 ||
                    formData.roles.length === 0
                  }
                >
                  {isSaving ? t('common.loading') : t('personnel.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-medium text-white">
                {t('personnel.password.title', 'Reset password')}
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-200"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300">
                {t('personnel.password.subtitle', {
                  username: passwordTargetUser?.username || '',
                })}
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {t('personnel.password.new', 'New password')}
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {t('personnel.password.confirm', 'Confirm password')}
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  type="button"
                  disabled={isSaving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSavePassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? t('common.loading')
                    : t('personnel.password.save', 'Update password')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {t('personnel.confirmDeletion')}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-slate-300">
                {t('personnel.deleteConfirmation', {
                  username: getUsernameById(userToDelete || ''),
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isDeleting}
                >
                  {isDeleting ? t('common.loading') : t('personnel.deleteUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelManagement;
