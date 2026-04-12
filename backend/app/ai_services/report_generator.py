"""
NeuroVia Report Generator — Phase 8
Aggregates all AI orchestrator components into a unified dashboard structure.
"""

from typing import Dict, Any

def generate_cognitive_report(orchestrator_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms the raw output dictionary of the orchestrator pipeline
    into a structured, frontend-ready medical report formatting.
    """
    risk = orchestrator_state.get("risk", {})
    trend = orchestrator_state.get("trend", {})
    semantic = orchestrator_state.get("semantic", {})
    clock = orchestrator_state.get("clock", {})
    doctor_summary = orchestrator_state.get("doctor_summary", "No clinical summary available.")

    # Base diagnostic block
    diagnostics = {
        "risk_level": risk.get("risk_level", "Unknown"),
        "risk_score": risk.get("risk_score", 0.0),
        "longitudinal_trend": trend.get("trend", "Insufficient Data"),
        "clinical_summary": doctor_summary
    }

    # Gather Key Indicators (the "Why")
    indicators = []
    
    # 1. Pull top XGBoost drivers
    for factor in risk.get("top_driving_factors", []):
         weight_pct = int(factor.get("impact_weight", 0) * 100)
         indicators.append(f"Primary risk driver: {factor['factor']} (impact weight: {weight_pct}%)")
         
    # 2. Pull statistical time-series hits
    for pt in trend.get("patterns", []):
         # Skip generic "not enough data" patterns if true risks exist
         if "Need at least 3 logs" not in pt and "within typical baseline" not in pt:
             indicators.append(f"Longitudinal Pattern: {pt}")
             
    # 3. Pull deterministic failures
    if clock.get("score", 10) < 6:
         indicators.append(f"Visual-Spatial Deficit: Clock drawing scored poorly ({clock.get('score', 0)}/10)")
         
    if semantic.get("score", 10) < 5:
        inv_count = len(semantic.get("invalid_words", []))
        if inv_count > 0:
            indicators.append(f"Semantic Error Focus: Provided {inv_count} words outside category adherence.")

    # Ensure list is never entirely empty for the UI
    if not indicators:
         if risk.get("risk_level") == "Low":
             indicators.append("All primary diagnostic vectors performed nominally.")
         else:
             indicators.append("Indicators inconclusive. Manual clinical review required.")

    # Recommendations Aggregation
    recommendations = []
    rec_trend = trend.get("recommendation", "")
    if rec_trend:
         recommendations.append(rec_trend)
         
    if risk.get("risk_level") == "High":
         recommendations.append("Priority: Schedule comprehensive neurological panel assessment within 14 days.")
    elif risk.get("risk_level") == "Moderate":
         recommendations.append("Monitor closely over next 90 days. Emphasize regulated sleep patterns and cognitive exercises.")
         
    if not recommendations:
         recommendations.append("Continue standard routine care.")

    return {
        "report_id": "REP-" + str(hash(str(orchestrator_state)))[-8:],
        "status": "completed",
        "diagnostics": diagnostics,
        "key_indicators": indicators,
        "recommendations": recommendations,
        "raw_scores": {
            "semantic_score": semantic.get("score", 0),
            "clock_score": clock.get("score", 0),
            "risk": risk.get("risk_score", 0),
        }
    }
