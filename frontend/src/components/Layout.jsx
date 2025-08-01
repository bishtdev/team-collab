import React from 'react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center p-4 shadow bg-white dark:bg-gray-800">
        <div className="text-xl font-bold">Team Collab</div>
        <div className="flex items-center gap-4">
          {user && <div className="text-sm">{user.name} ({user.role})</div>}
          <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">
            Logout
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-60 p-4 border-r bg-white dark:bg-gray-800">
          {/* Sidebar links: Projects, Tasks, Chat, Team */}
        </aside>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
