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
      <div className="font-sans min-h-screen flex flex-col bg-[#f5f0e8] text-[#1a2744]">
        <header className="bg-[#f5f0e8] px-10 py-5 border-b border-[#e2dcd0] flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => window.location.href = '/patient/dashboard'}
            className="flex items-center gap-2 bg-transparent border-none font-medium text-[15px] text-[#1a2744] cursor-pointer hover:text-[#6b7c52] transition-colors"
          >
            ← Back
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#6b7c52] rounded-[8px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <span className="font-semibold text-[1.1rem] text-[#1a2744]">NeuroVia</span>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col items-center p-6 sm:p-10">
          {renderCurrentLevel()}
        </main>
      </div>
    );
}
