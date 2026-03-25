import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiUsers, FiFolder, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems = [
    { to: '/projects', label: 'Projects', icon: <FiFolder className="w-5 h-5" /> },
    { to: '/chat', label: 'Chat', icon: <FiMessageSquare className="w-5 h-5" /> },
    { to: '/setup-team', label: 'Team', icon: <FiUsers className="w-5 h-5" /> },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-gray-200 to-gray-400 p-0.5 rounded-lg">
              <div className="bg-black p-1 rounded-md">
                <FiHome className="text-lg text-white" />
              </div>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
              TeamCollab
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/20">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium text-gray-200 leading-tight">{user.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Logout"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed md:relative z-20 md:z-0
            w-60 md:w-16 lg:w-60 h-[calc(100vh-53px)]
            bg-gray-950 border-r border-gray-800/80
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="flex flex-col gap-1 p-3 mt-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gray-800/80 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/40'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full" />
                    )}
                    <div className="flex-shrink-0">{item.icon}</div>
                    <span className="md:hidden lg:inline text-sm font-medium">{item.label}</span>
                    {/* Tooltip for collapsed sidebar */}
                    <span className="hidden md:block lg:hidden absolute left-14 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700 whitespace-nowrap shadow-xl">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
