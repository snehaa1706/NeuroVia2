import { useState } from 'react';
import { startAssessment } from '../api/screeningApi';

export default function Start({ onNext }) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await startAssessment();
      localStorage.setItem("screening_assessmentId", data.assessment_id);
      onNext(data.assessment_id, data.level1_context);
    } catch (err) {
      alert("Error starting test: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", maxWidth: "600px", margin: "80px auto", padding: "40px" }}>
      <div style={{ 
        background: "var(--color-bg-card)",
        padding: "60px 40px",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(27, 42, 65, 0.06)",
        borderTop: "8px solid var(--color-teal)"
      }}>
        <div style={{ 
          width: "60px", height: "60px", background: "var(--color-teal-50)", 
          color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "50%", margin: "0 auto 24px", fontSize: "24px"
        }}>
          🧠
        </div>
        <h1 style={{ 
          fontFamily: "var(--font-serif)", 
          color: "var(--color-navy)", 
          fontSize: "44px", 
          marginBottom: "20px",
          fontWeight: "600"
        }}>
          Dementia Screening
        </h1>
        <p style={{ 
          color: "var(--color-text-secondary)", 
          fontSize: "18px", 
          marginBottom: "40px", 
          lineHeight: "1.7" 
        }}>
          Take a short, research-backed cognitive assessment. Five questions, under five minutes. Our AI identifies patterns that may need a closer look.
        </p>
        <button 
          onClick={handleStart} 
          disabled={loading}
          style={{ 
            padding: "16px 40px", 
            fontSize: "16px", 
            fontFamily: "var(--font-sans)",
            background: "var(--color-teal)", 
            color: "white", 
            border: "none", 
            borderRadius: "12px", 
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            boxShadow: "0 8px 16px rgba(143, 163, 150, 0.3)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease"
          }}
          onMouseOver={e => !loading && (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseOut={e => !loading && (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading ? "INITIALIZING..." : "START YOUR SCREENING →"}
        </button>
      </div>
    </div>
  );
}
