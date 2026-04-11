import React, { useState, useEffect } from 'react';
import Start from '../pages/Start';
import Level1 from '../pages/Level1';
import Level2 from '../pages/Level2';
import Level3 from '../pages/Level3';
import Result from '../pages/Result';

export default function ScreeningApp() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [assessmentId, setAssessmentId] = useState(localStorage.getItem('screening_assessmentId') || null);
  const [contextData, setContextData] = useState(null);
  const [resultData, setResultData] = useState(null);

  const handleStart = (newAssessmentId, level1Context) => {
    setAssessmentId(newAssessmentId);
    setContextData(level1Context);
    setCurrentLevel(1);
  };

  const handleLevel1Complete = (level2Context) => {
    setContextData(level2Context);
    setCurrentLevel(2);
  };

  const handleLevel2Complete = (level3Context, resultObj) => {
    if (resultObj) {
      setResultData(resultObj);
      setCurrentLevel('completed');
    } else {
      setContextData(level3Context);
      setCurrentLevel(3);
    }
  };

  const handleLevel3Complete = (resultObj) => {
    setResultData(resultObj);
    setCurrentLevel('completed');
  };

  const resetFlow = () => {
    localStorage.removeItem('screening_assessmentId');
    setAssessmentId(null);
    setContextData(null);
    setResultData(null);
    setCurrentLevel(0);
  };

  const renderCurrentLevel = () => {
    if (currentLevel === 0) {
      return <Start onNext={handleStart} />;
    }
    if (currentLevel === 1) {
      return (
        <Level1 
          assessmentId={assessmentId} 
          initialContext={contextData} 
          onNext={handleLevel1Complete} 
        />
      );
    }
    if (currentLevel === 2) {
      return (
        <Level2 
          assessmentId={assessmentId} 
          initialContext={contextData} 
          onNext={handleLevel2Complete} 
        />
      );
    }
    if (currentLevel === 3) {
      return (
        <Level3 
          assessmentId={assessmentId} 
          initialContext={contextData} 
          onNext={handleLevel3Complete} 
        />
      );
    }
    if (currentLevel === 'completed') {
      return <Result resultData={resultData} onReset={resetFlow} />;
    }
    return <Start onNext={handleStart} />;
  };

  return (
    <div style={{ background: "var(--color-bg-page)", minHeight: "100vh", paddingBottom: "60px" }}>
      <header style={{ 
        background: "var(--color-navy)", 
        color: "var(--color-bg-page)", 
        padding: "24px 40px", 
        boxShadow: "0 4px 12px rgba(27, 42, 65, 0.15)",
        marginBottom: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px"
      }}>
        <div style={{ fontSize: "28px" }}>🩺</div>
        <h1 style={{ 
          fontFamily: "var(--font-serif)", 
          margin: 0, 
          fontSize: "32px",
          letterSpacing: "1px",
          fontWeight: "600"
        }}>
          NeuroVia Cognitive Screening
        </h1>
      </header>
      <main>
        {renderCurrentLevel()}
      </main>
    </div>
  );
}
