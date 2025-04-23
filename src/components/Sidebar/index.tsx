import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems = [
    {
      id: 'problem-setting',
      label: 'Problem Setting',
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      id: 'submissions',
      label: 'Submissions',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-72'} bg-slate-800 h-full flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div className="px-6 py-8 border-b border-slate-700/50">
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && (
            <h2 className="text-xl font-medium text-white tracking-tight">
              <span className="text-indigo-400">Algo</span>rithmia
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

      <div className="mt-auto p-4 border-t border-slate-700/50">
        <div
          className={`flex ${collapsed ? 'justify-center' : 'items-center'}`}
        >
          {!collapsed ? (
            <>
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">User</p>
                <p className="text-xs text-slate-400">Settings</p>
              </div>
            </>
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
