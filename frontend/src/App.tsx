import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

function App() {
  useEffect(() => {
    // SECURITY: Purge legacy keys to prevent session cross-contamination
    localStorage.removeItem('neurovia_user');
    
    // Auto-fix corrupted patient sessions where a doctor was accidentally saved
    const patientStr = localStorage.getItem('neurovia_patient_user');
    if (patientStr) {
      try {
        const pUser = JSON.parse(patientStr);
        if (pUser.role === 'doctor') {
          localStorage.removeItem('neurovia_patient_user');
          localStorage.removeItem('neurovia_patient_token');
        }
      } catch (e) {}
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
