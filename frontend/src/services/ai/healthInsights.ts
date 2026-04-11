export const generateHealthInsights = async (logs: any[]) => {
  // TODO: Replace with real AI insights logic when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: "Patient has been sleeping well but showed mild confusion yesterday.",
        recommendations: [
          "Ensure regular hydration.",
          "Maintain clear and bright lighting in the evening."
        ]
      });
    }, 500);
  });
};
