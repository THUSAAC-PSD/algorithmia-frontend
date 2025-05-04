import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface User {
  user_id: string;
  username: string;
  email: string;
  role: 'user' | 'verifier' | 'admin' | 'super_admin';
  created_at: Date;
}

const PersonnelManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
  });

  // Load mock data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          user_id: '1',
          username: 'John Smith',
          email: 'john@example.com',
          role: 'user',
          created_at: new Date('2024-12-15'),
        },
        {
          user_id: '2',
          username: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'verifier',
          created_at: new Date('2025-01-20'),
        },
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Handle user edit
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setShowUserModal(true);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // Execute user deletion
  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.user_id !== userToDelete));
      // TODO: Add API call to delete user
    }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle user save (update only)
  const handleSaveUser = () => {
    if (currentUser) {
      // Update existing user
      setUsers(
        users.map((user) =>
          user.user_id === currentUser.user_id
            ? {
                ...user,
                username: formData.username,
                email: formData.email,
                role: formData.role as User['role'],
              }
            : user,
        ),
      );
    }

    setShowUserModal(false);
  };

  // Get badge color based on role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-300';
      case 'admin':
        return 'bg-purple-500/20 text-purple-300';
      case 'verifier':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  // Get username by user ID
  const getUsernameById = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.username : 'Unknown User';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Personnel Management</h1>
        {/* Removed Add User button */}
      </div>

      {/* Filters and Search */}
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
            placeholder="Search users by username or email..."
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
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="verifier">Verifier</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No users found matching your filters.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
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
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.created_at.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        title="Edit User"
                        type="button"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.user_id)}
                        className="p-1 rounded-full hover:bg-slate-600 text-slate-300"
                        type="button"
                        title="Delete User"
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

      {/* Edit User Modal */}
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
                Edit User: {currentUser?.username}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
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
                    Username
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
                    Email
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                    <option value="verifier">Verifier</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Animation */}
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
                Confirm Deletion
              </h2>
            </div>

            <div className="p-6">
              <p className="text-slate-300">
                Are you sure you want to delete user{' '}
                <span className="font-semibold text-white">
                  {getUsernameById(userToDelete || '')}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  type="button"
                >
                  Delete
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
