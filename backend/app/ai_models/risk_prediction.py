"""
NeuroVia Risk Prediction Model — Phase 2
Predicts cognitive risk score (0-100) using XGBoost.
Trained on synthetic clinical data mapping screening results to risk.
"""

import os
import numpy as np
from pathlib import Path
from typing import Dict, Any

try:
    import joblib
    from xgboost import XGBClassifier, XGBRegressor
    from sklearn.model_selection import train_test_split
except ImportError:
    # Handle graceful degradation if ML deps are missing
    joblib = None
    XGBRegressor = None


class RiskPredictor:
    """XGBoost model for cognitive risk prediction mapping scores to a 0-100 scale."""

    MODEL_DIR = Path(__file__).parent / "trained"
    MODEL_PATH = MODEL_DIR / "risk_model.joblib"

    # Feature mapping and expected bounds for scaling
    FEATURES = {
        "ad8": {"min": 0, "max": 8, "description": "AD8 Questionnaire Score (0-8)"},
        "digit_span": {"min": 0, "max": 14, "description": "Working memory digit span"},
        "delayed_recall": {"min": 0, "max": 12, "description": "Words recalled after delay"},
        "stroop_rt": {"min": 400, "max": 3000, "description": "Stroop reaction time (ms)"},
        "semantic_fluency": {"min": 0, "max": 30, "description": "Words named in category"},
        "sleep_quality": {"min": 1, "max": 10, "description": "Self-reported sleep (1=poor)"},
        "confusion_count": {"min": 0, "max": 20, "description": "Recent confusion episodes"}
    }

    def __init__(self):
        self._model = None
        
        # Ensure trained directory exists
        self.MODEL_DIR.mkdir(parents=True, exist_ok=True)
        
        # Auto-load or fallback
        if XGBRegressor is None:
            self._available = False
        else:
            self._available = True
            self._load_or_train()

    def _load_or_train(self):
        """Load the model from disk, or train it using synthetic data if missing."""
        if self.MODEL_PATH.exists():
            self._model = joblib.load(self.MODEL_PATH)
        else:
            self.train_synthetic()

    def _generate_synthetic_data(self, samples=2000):
        """Generates realistic synthetic data mapping test scores to cognitive risk."""
        np.random.seed(42) # For reproducible mock data
        
        X = []
        y = []
        
        for _ in range(samples):
            # Generate feature vector based on a hidden "latent risk factor" (0-1)
            # High latent risk = worse scores
            latent_risk = np.random.beta(2, 5) # Skewed toward healthier population
            
            # AD8: higher is worse (more "yes" answers)
            ad8 = np.clip(np.random.normal(latent_risk * 8, 1.5), 0, 8)
            
            # Digit Span: lower is worse
            ds_base = 14 - (latent_risk * 10)
            digit_span = np.clip(np.random.normal(ds_base, 2), 0, 14)
            
            # Delayed Recall: lower is worse
            dr_base = 12 - (latent_risk * 10)
            delayed_recall = np.clip(np.random.normal(dr_base, 1.5), 0, 12)
            
            # Stroop RT: higher is worse (slower)
            rt_base = 600 + (latent_risk * 2000)
            stroop_rt = np.clip(np.random.normal(rt_base, 300), 400, 3000)
            
            # Semantic Fluency: lower is worse
            sf_base = 25 - (latent_risk * 18)
            semantic_fluency = np.clip(np.random.normal(sf_base, 4), 0, 30)
            
            # Sleep Quality: lower is worse
            sq_base = 9 - (latent_risk * 6)
            sleep_quality = np.clip(np.random.normal(sq_base, 1.5), 1, 10)
            
            # Confusion Count: higher is worse
            cc_base = latent_risk * 15
            confusion_count = np.clip(np.random.normal(cc_base, 2), 0, 20)
            
            # True Risk Score calculation (weighted composite of inputs + noise)
            # 0-100 scale where 100 is maximum risk
            risk_score = latent_risk * 100
            risk_score = np.clip(np.random.normal(risk_score, 5), 0, 100)
            
            X.append([ad8, digit_span, delayed_recall, stroop_rt, semantic_fluency, sleep_quality, confusion_count])
            y.append(risk_score)
            
        return np.array(X), np.array(y)

    def train_synthetic(self):
        """Train the XGBoost regressor on synthetic data and save to disk."""
        if not self._available:
            return False
            
        print("Training synthetic risk prediction model...")
        X, y = self._generate_synthetic_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self._model = XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        )
        self._model.fit(X_train, y_train)
        
        # Save model
        joblib.dump(self._model, self.MODEL_PATH)
        return True

    def _extract_features(self, patient_data: Dict[str, Any]) -> np.ndarray:
        """Extract and normalize inputs from the patient dictionary."""
        vector = []
        for feat, bounds in self.FEATURES.items():
            # Extract or use midpoint fallback
            val = patient_data.get(feat, None)
            if val is None:
                # Use healthy median if data is missing
                if feat in ["ad8", "confusion_count"]:
                    val = bounds["min"] # 0
                elif feat == "stroop_rt":
                    val = 800 # Fast/healthy
                else:
                    val = bounds["max"] * 0.8 # 80% of max is generally healthy
            
            # Ensure within bounds
            try:
                val = float(val)
                val = max(bounds["min"], min(val, bounds["max"]))
            except (ValueError, TypeError):
                # Fallback on parse failure
                val = bounds["min"] if feat in ["ad8", "confusion_count", "stroop_rt"] else bounds["max"]
                
            vector.append(val)
        return np.array([vector])

    def predict_risk(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict cognitive risk from 0-100 to yield a diagnostic band."""
        if not self._available or self._model is None:
            # Safe Fallback if ML dependencies fail
            return self._heuristic_fallback(patient_data)
            
        # 1. Run ML Inference
        X = self._extract_features(patient_data)
        raw_score = float(self._model.predict(X)[0])
        score = max(0.0, min(100.0, raw_score))
        
        # 2. Extract Feature Importances for explainability
        importances = self._model.feature_importances_
        top_factors = []
        
        # Zip feature names with their importance score and the user's actual input
        feature_names = list(self.FEATURES.keys())
        zipped = list(zip(feature_names, importances, X[0]))
        zipped.sort(key=lambda x: x[1], reverse=True)
        
        for name, imp, val in zipped[:3]: # Keep top 3 driving factors
            if imp > 0.1: # Only include if vaguely significant
                top_factors.append({
                    "factor": name,
                    "value": float(val),
                    "impact_weight": float(imp)
                })

        # 3. Categorize
        if score < 25:
            level = "Low"
            desc = "Normal cognitive function indicated."
        elif score < 60:
            level = "Moderate"
            desc = "Mild cognitive friction detected. Monitoring recommended."
        else:
            level = "High"
            desc = "Significant cognitive risk detected. Clinical follow-up indicated."

        return {
            "risk_score": round(score, 1),
            "risk_level": level,
            "description": desc,
            "top_driving_factors": top_factors,
            "method": "xgboost"
        }

    def _heuristic_fallback(self, p: Dict[str, Any]) -> Dict[str, Any]:
        """Simple rules-based engine if XGBoost fails to load."""
        score = 0
        
        ad8 = float(p.get("ad8", 0))
        if ad8 > 2: score += 30
        if ad8 > 5: score += 20
        
        ds = float(p.get("digit_span", 14))
        if ds < 7: score += 20
        
        dr = float(p.get("delayed_recall", 12))
        if dr < 5: score += 20
        
        if int(p.get("confusion_count", 0)) > 2: score += 10
        
        score = min(score, 100)
        level = "Low" if score < 25 else "Moderate" if score < 60 else "High"
        
        return {
            "risk_score": float(score),
            "risk_level": level,
            "description": "Rules-based fallback output.",
            "top_driving_factors": [],
            "method": "fallback_rules"
        }
