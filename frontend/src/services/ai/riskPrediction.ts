export const predictRisk = async (patientData: any) => {
  // TODO: Replace with real AI prediction logic when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        risk_score: 15,
        risk_band: "Low Risk",
        confidence: "80%",
        insight: "Patient is currently stable based on recent indicators."
      });
    }, 500);
  });
};
