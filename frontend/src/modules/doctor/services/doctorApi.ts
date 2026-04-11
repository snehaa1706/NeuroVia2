const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  // Try doctor-specific token first, then generic, then consult
  const token = localStorage.getItem('neurovia_doctor_token') || localStorage.getItem('consult_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const doctorApi = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/doctors/consult/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch doctor stats');
    return res.json();
  },

  getConsultations: async () => {
    const res = await fetch(`${API_URL}/doctors/consult/requests`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch consultations');
    return res.json();
  },

  getPatients: async () => {
    const res = await fetch(`${API_URL}/doctors/patients`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  getPatientDashboard: async (patientId: string) => {
    const res = await fetch(`${API_URL}/doctors/patients/${patientId}/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch patient dashboard');
    return res.json();
  },

  respondToConsultation: async (consultationId: string, response: { diagnosis: string, notes: string, prescription_text?: string, vitals?: any, attachments?: string[], follow_up_date: string }) => {
    const res = await fetch(`${API_URL}/doctors/consult/requests/${consultationId}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(response)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to submit consultation response' }));
      throw new Error(errorData.detail || 'Failed to submit consultation response');
    }
    return res.json();
  },

  updateConsultationStatus: async (consultationId: string, status: string) => {
    const res = await fetch(`${API_URL}/doctors/consult/requests/${consultationId}/status?status=${status}`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to update consultation status' }));
      throw new Error(errorData.detail || 'Failed to update consultation status');
    }
    return res.json();
  },

  cancelConsultation: async (consultationId: string) => {
    const res = await fetch(`${API_URL}/doctors/consult/requests/${consultationId}/status?status=cancelled`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Cannot cancel this consultation' }));
      throw new Error(errorData.detail || 'Cannot cancel this consultation');
    }
    return res.json();
  },

  updateWorkingHours: async (workingHours: any) => {
    const res = await fetch(`${API_URL}/doctors/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ working_hours: workingHours })
    });
    if (!res.ok) throw new Error('Failed to update working hours');
    return res.json();
  }
};
