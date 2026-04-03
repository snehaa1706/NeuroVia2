const BASE_URL = "http://localhost:8000";

export const getDailyPlan = () => fetch(`${BASE_URL}/activities/daily-plan`);
export const getActivity = (type: string) => fetch(`${BASE_URL}/ai/generate-activity`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer TEST_TOKEN" },
  body: JSON.stringify({ patient_id: "mock", activity_type: type.toLowerCase().replace(" ", "_"), difficulty: "easy" })
});
export const submitActivity = (data: any) => fetch(`${BASE_URL}/activities/submit`, { method: "POST", body: JSON.stringify(data) });

export const getReports = () => fetch(`${BASE_URL}/reports/today`);
export const getHistory = () => fetch(`${BASE_URL}/reports/history`);

export const getMedications = () => fetch(`${BASE_URL}/medications`);
export const getAlerts = () => fetch(`${BASE_URL}/alerts`);
