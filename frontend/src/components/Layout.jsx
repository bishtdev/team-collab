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
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
    <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
      <div className="text-xl font-bold flex items-center">
        <div className="bg-gradient-to-br from-gray-200 to-gray-400 p-0.5 rounded-lg mr-2">
          <div className="bg-black p-1 rounded-md">
            <FiHome className="text-xl text-white" />
          </div>
        </div>
        <span className="bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
          TeamCollab
        </span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="text-sm hidden md:block">
              <span className="text-gray-200">{user.name}</span>
              <span className="text-gray-400 ml-1">({user.role})</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-300 border border-gray-700"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
    <div className="flex flex-1">
      <aside className="w-16 md:w-60 p-2 md:p-4 bg-black border-r border-gray-800 z-10">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 md:px-4 md:py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'hover:bg-gray-900 text-gray-400'
                }`
              }
            >
              <div className="text-xl">{item.icon}</div>
              <span className="hidden md:inline text-sm font-medium">{item.label}</span>
              <span className="md:hidden text-xs absolute left-16 ml-2 bg-gray-900 text-white p-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-br from-gray-900 to-black">
        {children}
      </main>
    </div>
  </div>
  );
};

export default Layout;