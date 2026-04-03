import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientLayout from '../modules/patient/layout/PatientLayout';
import Dashboard from '../modules/patient/pages/Dashboard';
import Activities from '../modules/patient/pages/Activities';
import Medications from '../modules/patient/pages/Medications';
import Alerts from '../modules/patient/pages/Alerts';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PatientLayout />}>
        {/* Redirect root to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<Activities />} />
        <Route path="medications" element={<Medications />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
