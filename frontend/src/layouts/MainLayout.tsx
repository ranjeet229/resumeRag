import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Main layout for authenticated pages
 */
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* TODO: Add Navbar component */}
      <nav className="bg-white shadow-sm">
        {/* Navbar content */}
      </nav>

      {/* TODO: Add Sidebar component */}
      <aside className="fixed inset-y-0 left-0 bg-white shadow-sm w-64">
        {/* Sidebar content */}
      </aside>

      {/* Main content */}
      <main className="ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;