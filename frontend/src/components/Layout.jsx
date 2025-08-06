// Layout.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiUsers, FiFolder, FiLogOut } from 'react-icons/fi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  const sidebarItems = [
    { to: '/projects', label: 'Projects', icon: <FiFolder className="w-5 h-5" /> },
    { to: '/chat', label: 'Chat', icon: <FiMessageSquare className="w-5 h-5" /> },
    { to: '/setup-team', label: 'Team', icon: <FiUsers className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="flex justify-between items-center p-4 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="text-xl font-bold flex items-center">
          <FiHome className="mr-2 text-2xl" />
          Team Collab
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user.name.charAt(0)}
              </div>
              <div className="text-sm hidden md:block">
                {user.name} <span className="text-blue-200">({user.role})</span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 shadow hover:shadow-md"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-16 md:w-60 p-2 md:p-4 bg-white dark:bg-gray-800 shadow-md transition-all duration-300 z-10">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 md:px-4 md:py-2.5 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`
                }
              >
                <div className="text-xl">{item.icon}</div>
                <span className="hidden md:inline text-sm font-medium">{item.label}</span>
                <span className="md:hidden text-xs absolute left-16 ml-2 bg-gray-800 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6 overflow-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;