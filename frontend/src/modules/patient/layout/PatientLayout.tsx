import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const PatientLayout = () => {
  const stored = localStorage.getItem('neurovia_patient_user');
  const user = stored ? JSON.parse(stored) : null;

  // 🛡️ SECURITY: Require an active patient session
  if (!user || user?.role === 'doctor') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-(--color-bg)">
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
