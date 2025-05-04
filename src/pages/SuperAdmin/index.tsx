import {
  Cog6ToothIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Link, Outlet, useLocation } from 'react-router-dom';

const SuperAdmin = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Navigation items for super admin
  const navItems = [
    {
      name: 'Personnel Management',
      icon: <UserGroupIcon className="w-5 h-5" />,
      path: 'personnel',
    },
    {
      name: 'Competition Management',
      icon: <TrophyIcon className="w-5 h-5" />,
      path: 'competitions',
    },
    {
      name: 'System Settings',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      path: 'settings',
    },
  ];

  return (
    <div className="flex w-full h-screen bg-slate-900 grow">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Super Admin</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg ${
                    currentPath === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdmin;
