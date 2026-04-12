const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getDailyPlan = () => fetch(`${BASE_URL}/activities/daily-plan`);
export const getActivity = (type: string, level: number = 1, language: string = "en") => {
  const token = localStorage.getItem('neurovia_patient_token') || "TEST_TOKEN";
  const difficulty = level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard';
  return fetch(`${BASE_URL}/ai/generate-activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ activity_type: type.toLowerCase().replace(" ", "_"), difficulty, level, language })
  });
};
export const submitActivity = (data: any) => fetch(`${BASE_URL}/activities/submit`, { method: "POST", body: JSON.stringify(data) });

export const getReports = () => fetch(`${BASE_URL}/reports/today`);
export const getHistory = () => fetch(`${BASE_URL}/reports/history`);

export const getMedications = () => fetch(`${BASE_URL}/medications`);
export const getAlerts = () => fetch(`${BASE_URL}/alerts`);
