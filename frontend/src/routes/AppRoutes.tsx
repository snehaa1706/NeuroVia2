import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientLayout from '../modules/patient/layout/PatientLayout';
import Dashboard from '../modules/patient/pages/Dashboard';
import Activities from '../modules/patient/pages/Activities';
import Medications from '../modules/patient/pages/Medications';
import Alerts from '../modules/patient/pages/Alerts';
import Settings from '../modules/patient/pages/Settings';
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import ScreeningPage from '../modules/screening/pages/ScreeningPage';

// Doctor Portal Imports (dashboard-based)
import DoctorDashboard from '../modules/doctor/pages/DoctorDashboard';
import PatientList from '../modules/doctor/pages/PatientList';
import PatientDetail from '../modules/doctor/pages/PatientDetail';
import Consultations from '../modules/doctor/pages/Consultations';
import ConsultationDetail from '../modules/doctor/pages/ConsultationDetail';
import DoctorSchedule from '../modules/doctor/pages/DoctorSchedule';
import DoctorLayout from '../modules/doctor/layout/DoctorLayout';
import DoctorListing from '../modules/patient/pages/DoctorListing';
import ConsultationRequest from '../modules/patient/pages/ConsultationRequest';

// ===== ISOLATED CONSULTATION MODULE =====
import ConsultEntry from '../modules/consult/pages/ConsultEntry';
import ConsultLogin from '../modules/consult/pages/ConsultLogin';
import ConsultDoctors from '../modules/consult/pages/ConsultDoctors';
import ConsultRequest from '../modules/consult/pages/ConsultRequest';
import ConsultSuccess from '../modules/consult/pages/ConsultSuccess';
import ConsultDoctorView from '../modules/consult/pages/ConsultDoctorView';

const SmartDashboard = () => {
  const doctorStr = localStorage.getItem('neurovia_doctor_user');
  const patientStr = localStorage.getItem('neurovia_patient_user');

  // Strict validaton for doctor
  if (doctorStr) {
    try {
      const doc = JSON.parse(doctorStr);
      if (doc?.role?.toLowerCase() === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    } catch (e) {}
  }

  // Strict validaton for patient
  if (patientStr) {
    try {
      const pat = JSON.parse(patientStr);
      // We assume if it's in the patient key and not a doctor, it's a valid patient
      if (pat?.role?.toLowerCase() !== 'doctor') return <Navigate to="/patient/dashboard" replace />;
    } catch (e) {}
  }

  // If no valid session exists, force a login
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== PUBLIC PAGES ===== */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/screening" element={<ScreeningPage />} />

      {/* ===== SMART REDIRECT ===== */}
      <Route path="dashboard" element={<SmartDashboard />} />

      {/* ===== PATIENT DASHBOARD (UNTOUCHED) ===== */}
      <Route element={<PatientLayout />}>
        <Route path="patient/dashboard" element={<Dashboard />} />
        <Route path="patient/doctors" element={<DoctorListing />} />
        <Route path="activities" element={<Activities />} />
        <Route path="medications" element={<Medications />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="settings" element={<Settings />} />
        <Route path="consultation/request" element={<ConsultationRequest />} />
      </Route>

      {/* ===== DOCTOR DASHBOARD (UNTOUCHED) ===== */}
      <Route element={<DoctorLayout />}>
        <Route path="doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="doctor/patients" element={<PatientList />} />
        <Route path="doctor/patient/:id" element={<PatientDetail />} />
        <Route path="doctor/consultations" element={<Consultations />} />
        <Route path="doctor/consultation/:id" element={<ConsultationDetail />} />
        <Route path="doctor/schedule" element={<DoctorSchedule />} />
        <Route path="doctor/settings" element={<Settings />} />
      </Route>

      {/* ===== ISOLATED CONSULTATION MODULE ===== */}
      {/* Entry — role selection */}
      <Route path="/consult" element={<ConsultEntry />} />

      {/* Separate auth — NOT the main app login */}
      <Route path="/consult/login/patient" element={<ConsultLogin role="patient" />} />
      <Route path="/consult/login/doctor" element={<ConsultLogin role="doctor" />} />

      {/* Patient consultation flow (standalone) */}
      <Route path="/consult/patient/doctors" element={<ConsultDoctors />} />
      <Route path="/consult/patient/request" element={<ConsultRequest />} />
      <Route path="/consult/patient/success" element={<ConsultSuccess />} />

      {/* Doctor consultation flow (standalone with nav) */}
      <Route path="/consult/doctor" element={<ConsultDoctorView />}>
        <Route index element={<Navigate to="/consult/doctor/consultations" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patient/:id" element={<PatientDetail />} />
        <Route path="consultation/:id" element={<ConsultationDetail />} />
      </Route>

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
