export const generateAdaptiveTest = async (previousScore: number) => {
  // TODO: Replace with real AI adaptive test logic
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        difficulty: previousScore > 80 ? "hard" : "medium",
        questions: [
          { id: "q1", text: "What is today's date?", type: "recall" },
          { id: "q2", text: "Spell world backwards.", type: "cognitive" }
        ]
      });
    }, 500);
  });
};
