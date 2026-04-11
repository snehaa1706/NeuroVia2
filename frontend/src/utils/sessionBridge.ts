/**
 * Session bridging utility.
 * Checks both consult-specific and main app auth tokens,
 * so users don't have to log in twice.
 */

export function getConsultPatientAuth(): { token: string; user: any } | null {
  // 1. Check consult-specific storage first
  const consultToken = localStorage.getItem('consult_token');
  const consultUser = localStorage.getItem('consult_user');
  if (consultToken && consultUser) {
    return { token: consultToken, user: JSON.parse(consultUser) };
  }

  // 2. Fallback: check main patient auth
  const patientToken = localStorage.getItem('neurovia_patient_token');
  const patientUser = localStorage.getItem('neurovia_patient_user');
  if (patientToken && patientUser) {
    // Bridge: copy to consult storage so consult pages work seamlessly
    const user = JSON.parse(patientUser);
    localStorage.setItem('consult_token', patientToken);
    localStorage.setItem('consult_role', 'patient');
    localStorage.setItem('consult_user', patientUser);
    return { token: patientToken, user };
  }

  return null;
}

export function getConsultDoctorAuth(): { token: string; user: any } | null {
  // 1. Check consult-specific storage first
  const consultToken = localStorage.getItem('consult_token');
  const consultRole = localStorage.getItem('consult_role');
  const consultUser = localStorage.getItem('consult_user');
  if (consultToken && consultRole === 'doctor' && consultUser) {
    return { token: consultToken, user: JSON.parse(consultUser) };
  }

  // 2. Fallback: check main doctor auth
  const doctorToken = localStorage.getItem('neurovia_doctor_token');
  const doctorUser = localStorage.getItem('neurovia_doctor_user');
  if (doctorToken && doctorUser) {
    // Bridge: copy to consult storage
    const user = JSON.parse(doctorUser);
    localStorage.setItem('consult_token', doctorToken);
    localStorage.setItem('consult_role', 'doctor');
    localStorage.setItem('consult_user', doctorUser);
    return { token: doctorToken, user };
  }

  return null;
}
