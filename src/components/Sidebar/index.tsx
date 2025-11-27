import {
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import LanguageSwitcher from '../LanguageSwitcher';

type SidebarProps = { userRoles: string[]; userName?: string };

const Sidebar = ({ userRoles, userName }: SidebarProps) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const hasRole = (role: string) => userRoles.includes(role);
  const isAdmin = () => hasRole('admin') || hasRole('super_admin');

  const sidebarItems = [
    {
      id: 'problem-setting',
      label: t('sidebar.problemSetting'),
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      id: 'chat',
      label: t('sidebar.chat'),
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      id: 'problem-verification',
      label: t('sidebar.problemVerification'),
      icon: <DocumentCheckIcon className="w-5 h-5" />,
      show: hasRole('tester') || isAdmin(),
    },
    {
      id: 'problem-review',
      label: t('sidebar.problemReview'),
      icon: <DocumentMagnifyingGlassIcon className="w-5 h-5" />,
      show: hasRole('reviewer') || isAdmin(),
    },
    {
      id: 'problem-bank',
      label: t('sidebar.problemBank'),
      icon: <ServerStackIcon className="w-5 h-5" />,
      show: isAdmin(),
    },
    {
      id: 'contest-manager',
      label: t('sidebar.contestManager'),
      icon: <TrophyIcon className="w-5 h-5" />,
      show: hasRole('contest_manager') || hasRole('super_admin'),
    },
    {
      id: 'settings',
      label: t('sidebar.settings', 'Settings'),
      icon: <Cog6ToothIcon className="w-5 h-5" />,
    },
    {
      id: 'super-admin',
      label: t('sidebar.superAdmin'),
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      show: hasRole('super_admin'),
    },
  ];

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-80'} bg-slate-800 h-full flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div className="px-6 py-8 border-b border-slate-700/50">
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && (
            <h2 className="text-xl font-medium text-white tracking-tight">
              <NavLink to="/">
                <span className="text-indigo-400">Algo</span>rithmia
              </NavLink>
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`${collapsed ? 'mt-6 ml-1' : 'ml-4'} p-2 rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors`}
            type="button"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="mt-8 flex-1 px-3">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            if (item.show === false) return null;
            const path = '/' + item.id.replace(/-/g, '');
            return (
              <li key={item.id}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : ''}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`${
                          isActive
                            ? 'text-indigo-400'
                            : 'text-slate-400 group-hover:text-white'
                        } transition-colors`}
                      >
                        {item.icon}
                      </span>

                      {!collapsed && (
                        <span className="ml-3 font-medium tracking-wide">
                          {item.label}
                        </span>
                      )}

                      {isActive && !collapsed && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-indigo-400"></div>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Add Language Switcher above the user info section */}
      <div
        className={`px-4 py-3 border-t border-slate-700/50 ${collapsed ? 'flex justify-center' : ''}`}
      >
        <LanguageSwitcher collapsed={collapsed} />
      </div>

      <div className="mt-auto p-4 border-t border-slate-700/50">
        <div
          className={`flex ${collapsed ? 'justify-center' : 'items-center'}`}
        >
          {!collapsed ? (
            <>
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {(userName?.trim()?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-slate-400">Settings</p>
              </div>
              <div className="ml-auto">
                <NavLink
                  to="/signout"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1.5" />
                  Sign out
                </NavLink>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {(userName?.trim()?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
              <NavLink
                to="/signout"
                title="Sign out"
                className="h-8 w-8 rounded-full bg-slate-700/60 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
