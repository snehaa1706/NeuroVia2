"""
NeuroVia Cognitive Trend Detection — Phase 3
Statistical analysis over wellness history spanning multiple logs.
"""

import numpy as np
import scipy.stats as stats
from typing import List, Dict, Any, Optional

class TrendAnalyzer:
    """Analyzes time-series wellness arrays to detect declining/stable/improving trends."""
    
    @staticmethod
    def analyze_cognitive_trend(wellness_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Expects a list of dicts, sorted chronologically (oldest to newest):
        [
            {"date": "2023-10-01", "confusion_level": 2, "sleep_hours": 7, "mood": "neutral"},
            {"date": "2023-10-02", "confusion_level": 4, "sleep_hours": 5, "mood": "anxious"},
            ...
        ]
        """
        if not wellness_history or len(wellness_history) < 3:
            return {
                "trend": "Insufficient Data",
                "slope": 0.0,
                "patterns": ["Need at least 3 logs to establish trend."],
                "recommendation": "Continue logging daily wellness."
            }

        patterns = []
        recommendations = []
        
        # Extract time-series arrays
        try:
            # We want to see if confusion goes UP over time
            confusion_series = [float(log.get("confusion_level", 0)) for log in wellness_history]
            # We want to see if sleep goes DOWN
            sleep_series = [float(log.get("sleep_hours", 7)) for log in wellness_history]
            
            # X array (time units)
            x_time = np.arange(len(wellness_history))
            
            # 1. Confusion Linear Regression (Positive slope = getting worse)
            if len(set(confusion_series)) > 1: # Avoid perfect flatline errors in linregress
                c_slope, _, c_r, c_p, _ = stats.linregress(x_time, confusion_series)
                
                if c_slope > 0.2 and c_p < 0.1: # Significant positive slope
                    patterns.append(f"Agitation/Confusion is increasing (severity +{round(c_slope*10, 1)} per 10 logs).")
                    recommendations.append("Investigate potential triggers for increasing confusion (UTI, medication change).")
                elif c_slope < -0.2:
                    patterns.append("Confusion episodes are decreasing.")
            else:
                c_slope = 0
                
            # 2. Sleep Linear Regression (Negative slope = getting worse)
            if len(set(sleep_series)) > 1:
                s_slope, _, _, _, _ = stats.linregress(x_time, sleep_series)
                
                if s_slope < -0.15: # Losing 1.5 hours per 10 logs
                    patterns.append(f"Sleep disruption trend detected (losing ~{round(abs(s_slope)*5, 1)} hrs per 5 days).")
                    recommendations.append("Implement sleep hygiene protocols or consult physician regarding insomnia.")
            else:
                s_slope = 0

            # 3. Sudden drop detection (Comparing last 3 days vs previous baseline)
            if len(wellness_history) >= 7:
                baseline_confusion = np.mean(confusion_series[:-3])
                recent_confusion = np.mean(confusion_series[-3:])
                
                if recent_confusion > baseline_confusion + 2:
                    patterns.append("Acute spike in confusion over the last 72 hours.")
                    recommendations.append("Urgent! Sudden cognitive decline can indicate acute medical issues like UTI or stroke.")

            # Overall Vector
            # We sum negative indicators. High positive confusion slope + negative sleep slope
            composite_decline_vector = max(0, c_slope) + max(0, abs(min(0, s_slope)))
            
            if composite_decline_vector > 0.4:
                overall_trend = "Declining"
            elif composite_decline_vector < 0.1 and c_slope <= 0:
                overall_trend = "Stable"
            else:
                overall_trend = "Fluctuating"
                
            if not patterns:
                patterns.append("Values remain within typical personal baseline.")
            if not recommendations:
                recommendations.append("Continue current care plan routine.")
                
            return {
                "trend": overall_trend,
                "slope_vector": round(composite_decline_vector, 2),
                "patterns": patterns,
                "recommendation": " ".join(recommendations)
            }
            
        except Exception as e:
             return {
                "trend": "Error parsing time-series",
                "slope_vector": 0.0,
                "patterns": [str(e)],
                "recommendation": ""
            }
