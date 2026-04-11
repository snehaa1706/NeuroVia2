export const generateDoctorRecommendations = async (patientId: string) => {
  // TODO: Replace with real AI recommendations logic
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        actions: [
          "Follow up in 2 weeks to monitor medication adherence.",
          "Suggest mild cognitive exercises."
        ],
        alerts: [
          "Patient has missed 2 doses of Aricept this week."
        ]
      });
    }, 500);
  });
};
