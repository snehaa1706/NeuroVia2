import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import DoctorSidebar from '../components/DoctorSidebar';
import DoctorNavbar from '../components/DoctorNavbar';

const DoctorLayout = () => {
  const stored = localStorage.getItem('neurovia_doctor_user');
  const user = stored ? JSON.parse(stored) : null;

  // 🛡️ SECURITY: Require an active doctor session
  if (!user || user?.role?.toLowerCase() !== 'doctor') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-(--color-bg)">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full px-8 pb-12">
          <div className="max-w-7xl mx-auto w-full">
            <DoctorNavbar />
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;
