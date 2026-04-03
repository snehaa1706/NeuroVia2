import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const PatientLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-(--color-ivory)">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto px-8 pb-12 w-full">
            <Navbar />
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;
