export default function Result({ resultData, onReset }) {
  if (!resultData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)" }}>No Result Found</h2>
        <button onClick={onReset} style={{
          padding: "12px 24px", background: "var(--color-navy)", color: "white", 
          border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "20px"
        }}>
          Back to Start
        </button>
      </div>
    );
  }

  const {
    cognitive_score,
    risk_score,
    risk_band,
    clinical_recommendation,
    ai_explanation,
    ai_recommendation,
    ai_confidence
  } = resultData;

  const getThemeColor = (band) => {
    if(band === "low") return { bg: "var(--color-teal)", text: "#fff" };
    if(band === "moderate") return { bg: "#CD853F", text: "#fff" }; // Muted warm color
    return { bg: "#A44A4F", text: "#fff" }; // Muted elegant crimson instead of bright red
  };

  const themeInfo = getThemeColor(risk_band);

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "36px", textAlign: "center", borderBottom: "1px solid var(--color-primary-50)", paddingBottom: "20px", color: "var(--color-navy)", marginBottom: "40px" }}>
        Assessment Finalized
      </h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "var(--color-bg-card)", padding: "20px", borderRadius: "16px", textAlign: "center", border: "1px solid var(--color-primary-50)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "var(--color-text-secondary)", fontSize: "16px", fontWeight: "500" }}>Cognitive Score</h3>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "var(--color-navy)", margin: 0 }}>{(cognitive_score * 100).toFixed(1)}%</p>
        </div>
        <div style={{ background: "var(--color-bg-card)", padding: "20px", borderRadius: "16px", textAlign: "center", border: "1px solid var(--color-primary-50)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "var(--color-text-secondary)", fontSize: "16px", fontWeight: "500" }}>Risk Index</h3>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "var(--color-navy)", margin: 0 }}>{(risk_score * 100).toFixed(1)}%</p>
        </div>
        <div style={{ background: themeInfo.bg, color: themeInfo.text, padding: "20px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "rgba(255,255,255,0.8)", fontSize: "16px", fontWeight: "500" }}>Diagnostic Band</h3>
          <p style={{ fontSize: "32px", fontWeight: "700", margin: 0, textTransform: "capitalize" }}>{risk_band}</p>
        </div>
      </div>

      <div style={{ background: "var(--color-bg-hover)", padding: "30px", borderRadius: "16px", marginBottom: "30px", border: "1px solid var(--color-primary-50)" }}>
        <h4 style={{ margin: "0 0 15px 0", fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--color-navy)" }}>Clinical Baseline</h4>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: "1.6" }}>{clinical_recommendation}</p>
      </div>

      {(ai_explanation || ai_recommendation) &&(
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-primary-100)", borderLeft: "6px solid var(--color-navy)", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 24px rgba(27, 42, 65, 0.05)" }}>
          <h4 style={{ margin: "0 0 20px 0", fontFamily: "var(--font-serif)", fontSize: "22px", color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>NeuroVia AI Diagnostics</span>
            {ai_confidence && <span style={{ fontSize: "12px", background: "var(--color-teal-50)", color: "var(--color-teal-dark)", padding: "4px 10px", borderRadius: "20px", fontFamily: "var(--font-sans)", fontWeight: "600" }}>{ai_confidence.toUpperCase()} CONFIDENCE</span>}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6" }}>
              <strong style={{ color: "var(--color-navy)", display: "block", marginBottom: "5px" }}>Clinical Reasoning:</strong> 
              <span style={{ color: "var(--color-text-secondary)" }}>{ai_explanation}</span>
            </p>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6" }}>
              <strong style={{ color: "var(--color-navy)", display: "block", marginBottom: "5px" }}>Recommended Action:</strong> 
              <span style={{ color: "var(--color-text-secondary)" }}>{ai_recommendation}</span>
            </p>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <button onClick={() => {
          localStorage.removeItem('screening_assessmentId');
          onReset();
        }} style={{ 
          padding: "16px 40px", 
          cursor: "pointer", 
          background: "transparent",
          color: "var(--color-navy)",
          border: "2px solid var(--color-navy)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "16px",
          transition: "all 0.2s"
        }}
        onMouseOver={e => { e.currentTarget.style.background = "var(--color-navy)"; e.currentTarget.style.color = "white"; }}
        onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-navy)"; }}
        >
          Initialize New Screening
        </button>
      </div>
    </div>
  );
}
