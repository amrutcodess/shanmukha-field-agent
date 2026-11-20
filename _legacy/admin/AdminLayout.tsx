import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { BottomNav } from '../../components/BottomNav';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E8F5E9]/40 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 lg:pb-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
