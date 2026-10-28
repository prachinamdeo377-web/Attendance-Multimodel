import numpy as np
from typing import Dict, Any, List, Optional

class EngagementAnalyzer:
    """
    Multimodal Engagement Synthesis Service.
    Aligns temporal signals extracted from audio and computer vision streams,
    evaluates observable classroom participation dynamics, and computes an
    EXPLAINABLE experimental engagement index.

    CRITICAL ETHICAL DIRECTIVE:
    This index is an experimental multimodal proxy metric reflecting observable
    classroom auditory and visual activity. It does NOT claim to measure internal
    cognitive comprehension, psychological focus, emotional state, or intelligence.
    """

    FORMULA_VERSION = "v1.2-heuristic-explainable"

    def __init__(
        self,
        weight_visual: float = 0.50,
        weight_audio: float = 0.50,
        expected_nominal_faces: int = 15,
        target_speech_ratio: float = 0.35
    ):
        self.weight_visual = weight_visual
        self.weight_audio = weight_audio
        self.expected_nominal_faces = expected_nominal_faces
        self.target_speech_ratio = target_speech_ratio

    def align_and_compute(
        self,
        session_id: int,
        audio_result: Optional[Dict[str, Any]] = None,
        video_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes audio segments and video frame samples into a synchronized timeline
        and derives explainable engagement indicators.
        """
        warnings: List[str] = []
        has_audio = audio_result is not None and audio_result.get("status") == "COMPLETED"
        has_video = video_result is not None and video_result.get("status") == "COMPLETED"

        if not has_audio and not has_video:
            warnings.append("Neither valid audio nor video stream was available. Cannot compute multimodal index.")
            return {
                "session_id": session_id,
                "overall_engagement_score": 0.0,
                "visual_indicator_score": 0.0,
                "audio_indicator_score": 0.0,
                "timeline": [],
                "explainability": {
                    "method": "No signals available",
                    "visual_weight": self.weight_visual,
                    "audio_weight": self.weight_audio,
                    "active_features": []
                },
                "warnings": warnings,
                "formula_version": self.FORMULA_VERSION
            }

        if not has_audio:
            warnings.append("Audio stream missing or failed; engagement derived exclusively from visual presence proxy.")
        if not has_video:
            warnings.append("Video stream missing or failed; engagement derived exclusively from acoustic energy proxy.")

        # Determine shared timeline duration
        audio_duration = audio_result.get("duration_seconds", 0.0) if has_audio else 0.0
        video_duration = video_result.get("duration_seconds", 0.0) if has_video else 0.0
        total_duration = max(audio_duration, video_duration, 1.0)

        # Build 1-second interval grid for alignment
        time_steps = np.arange(0.0, total_duration, 1.0)
        timeline: List[Dict[str, Any]] = []

        audio_segments = audio_result.get("segments", []) if has_audio else []
        video_timeline = video_result.get("face_counts_timeline", []) if has_video else []

        # Convert video points to lookup map
        video_map = {round(sample["timestamp_seconds"]): sample.get("face_count", 0) for sample in video_timeline}

        point_scores: List[float] = []
        visual_scores: List[float] = []
        audio_scores: List[float] = []

        for t in time_steps:
            sec_int = int(round(t))

            # 1. Audio signal lookup
            rms_val = None
            speech_val = None
            if has_audio:
                matching_seg = next(
                    (s for s in audio_segments if s["start_seconds"] <= t < s["end_seconds"]),
                    None
                )
                if matching_seg:
                    rms_val = matching_seg["rms_energy"]
                    speech_val = matching_seg["speech_activity"]
                else:
                    rms_val = 0.0
                    speech_val = False

            # 2. Visual signal lookup
            face_cnt = None
            visual_active = None
            if has_video:
                face_cnt = video_map.get(sec_int, 0)
                visual_active = face_cnt > 0

            # 3. Calculate point-level heuristic
            # Visual score: scaled by nominal expected attendees (0.0 to 1.0)
            v_score = 0.0
            if has_video and face_cnt is not None:
                v_score = min(1.0, face_cnt / float(max(1, self.expected_nominal_faces)))
                visual_scores.append(v_score)

            # Audio score: 1.0 if speech active, else scaled proportional to acoustic energy
            a_score = 0.0
            if has_audio and rms_val is not None:
                if speech_val:
                    a_score = 0.90
                else:
                    a_score = min(0.60, rms_val * 4.0)
                audio_scores.append(a_score)

            # Multimodal fusion with dynamic fallback
            if has_video and has_audio:
                point_val = (v_score * self.weight_visual) + (a_score * self.weight_audio)
            elif has_video:
                point_val = v_score
            else:
                point_val = a_score

            scaled_point = round(float(point_val * 100.0), 1)
            point_scores.append(scaled_point)

            timeline.append({
                "timestamp_seconds": round(float(t), 1),
                "rms_energy": rms_val,
                "speech_active": speech_val,
                "face_count": face_cnt,
                "visual_active": visual_active,
                "point_engagement_score": scaled_point
            })

        mean_overall = float(np.mean(point_scores)) if point_scores else 0.0
        mean_visual = float(np.mean(visual_scores) * 100.0) if visual_scores else 0.0
        mean_audio = float(np.mean(audio_scores) * 100.0) if audio_scores else 0.0

        # Disclaimers and explainability documentation
        explainability = {
            "formula_name": "Multimodal Acoustic-Visual Heuristic Fusion",
            "weights": {
                "visual_presence_weight": self.weight_visual if (has_video and has_audio) else (1.0 if has_video else 0.0),
                "acoustic_activity_weight": self.weight_audio if (has_video and has_audio) else (1.0 if has_audio else 0.0)
            },
            "parameters": {
                "expected_nominal_faces": self.expected_nominal_faces,
                "target_speech_ratio": self.target_speech_ratio
            },
            "features_used": [
                f for f in [
                    "Detected Face Count Density" if has_video else None,
                    "Root Mean Square (RMS) Acoustic Energy" if has_audio else None,
                    "Acoustic Speech Activity Estimations" if has_audio else None
                ] if f is not None
            ],
            "interpretation_guide": (
                "Scores represent observable session vitality: higher scores indicate "
                "continuous visible attendance and interactive acoustic dynamics. "
                "Scores do NOT indicate student attentiveness, intellectual comprehension, "
                "or subject matter mastery."
            )
        }

        return {
            "session_id": session_id,
            "overall_engagement_score": round(mean_overall, 1),
            "visual_indicator_score": round(mean_visual, 1),
            "audio_indicator_score": round(mean_audio, 1),
            "timeline": timeline,
            "explainability": explainability,
            "warnings": warnings,
            "formula_version": self.FORMULA_VERSION
        }

engagement_analyzer = EngagementAnalyzer()
