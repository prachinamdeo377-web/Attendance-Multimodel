import json
from typing import Dict, Any, List, Optional


class EngagementFusion:
    FORMULA_VERSION = "2.0-multimodal-explainable"
    WEIGHT_VISUAL = 0.45
    WEIGHT_ACOUSTIC = 0.35
    WEIGHT_ATTENDANCE = 0.20

    @classmethod
    def synthesize(
        cls,
        visual_score: float,
        acoustic_score: float,
        attendance_ratio: float,
        session_duration_sec: float = 60.0
    ) -> Dict[str, Any]:
        """
        Fuses acoustic, computer vision, and attendance signals into an explainable engagement score.
        """
        # Clamping inputs
        v_norm = min(100.0, max(0.0, visual_score))
        a_norm = min(100.0, max(0.0, acoustic_score))
        att_norm = min(100.0, max(0.0, attendance_ratio * 100.0))

        # Weighted Linear Combination
        overall = round(
            (cls.WEIGHT_VISUAL * v_norm) +
            (cls.WEIGHT_ACOUSTIC * a_norm) +
            (cls.WEIGHT_ATTENDANCE * att_norm),
            1
        )

        # Classification bracket
        if overall >= 80.0:
            tier = "HIGH_ENGAGEMENT"
            tier_label = "Vibrant Interactive Session"
        elif overall >= 55.0:
            tier = "MODERATE_ENGAGEMENT"
            tier_label = "Attentive Balanced Lecture"
        else:
            tier = "PASSIVE_SESSION"
            tier_label = "Passive / Low Participation"

        # Synthetic synchronized timeline points (e.g., 5 intervals)
        timeline = []
        steps = 5
        step_duration = session_duration_sec / steps
        for i in range(steps):
            t_sec = round((i + 1) * step_duration, 1)
            # Simulated minor variance along the overall trajectory
            variation = ((i % 3) - 1) * 3.5
            timeline.append({
                "time_sec": t_sec,
                "overall_score": round(min(100.0, max(10.0, overall + variation)), 1),
                "visual_presence": round(min(100.0, max(10.0, v_norm + variation * 0.8)), 1),
                "acoustic_vitality": round(min(100.0, max(10.0, a_norm + variation * 1.2)), 1)
            })

        return {
            "formula_version": cls.FORMULA_VERSION,
            "overall_engagement_score": overall,
            "tier": tier,
            "tier_label": tier_label,
            "components": {
                "visual_presence_score": round(v_norm, 1),
                "visual_weight": cls.WEIGHT_VISUAL,
                "acoustic_vitality_score": round(a_norm, 1),
                "acoustic_weight": cls.WEIGHT_ACOUSTIC,
                "attendance_presence_score": round(att_norm, 1),
                "attendance_weight": cls.WEIGHT_ATTENDANCE,
            },
            "formula_description": (
                f"Engagement = ({cls.WEIGHT_VISUAL} × VisualPresence) + "
                f"({cls.WEIGHT_ACOUSTIC} × AcousticVitality) + "
                f"({cls.WEIGHT_ATTENDANCE} × AttendanceRatio)"
            ),
            "timeline": timeline,
            "ethical_notice": (
                "Ethical Notice: This indicator fuses physical presence, camera head orientation, "
                "and room acoustic activity. It serves as an observational telemetry tool and does not claim "
                "to measure internal psychological cognitive comprehension or emotions."
            )
        }


# Singleton instance
engagement_fusion = EngagementFusion()
