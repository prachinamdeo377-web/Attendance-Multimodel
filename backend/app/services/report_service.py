import csv
import io
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

class ReportService:
    """
    Session Summary and Export Generation Service.
    Produces auditable attendance CSVs, multimodal time-series exports,
    and comprehensive Markdown/HTML reports.
    """

    @staticmethod
    def generate_attendance_csv(session_info: Dict[str, Any], attendances: List[Dict[str, Any]]) -> str:
        """Generates RFC 4180 compliant CSV string for attendance records."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header metadata
        writer.writerow(["# Multimodal Attendance & Engagement Agent - Attendance Register"])
        writer.writerow(["# Session Code", session_info.get("session_code", "N/A")])
        writer.writerow(["# Course", session_info.get("course_name", "N/A")])
        writer.writerow(["# Title", session_info.get("title", "N/A")])
        writer.writerow(["# Generated At", datetime.now().isoformat()])
        writer.writerow([])

        # Table header
        writer.writerow([
            "Student ID",
            "Student Name",
            "Department",
            "Status",
            "Check-in Timestamp",
            "Verification Source",
            "Notes"
        ])

        for record in attendances:
            writer.writerow([
                record.get("student_code") or record.get("student_id", ""),
                record.get("student_name", ""),
                record.get("student_department", ""),
                record.get("status", "PRESENT"),
                record.get("check_in_time", ""),
                record.get("source", "MANUAL"),
                record.get("notes", "") or ""
            ])

        return output.getvalue()

    @staticmethod
    def generate_timeline_csv(timeline: List[Dict[str, Any]]) -> str:
        """Exports synchronized audio-visual time-series points to CSV."""
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Timestamp (seconds)",
            "RMS Audio Energy",
            "Speech Activity Detected",
            "Visible Face Count",
            "Visual Active",
            "Engagement Indicator (0-100)"
        ])

        for pt in timeline:
            writer.writerow([
                pt.get("timestamp_seconds", 0.0),
                pt.get("rms_energy", ""),
                "TRUE" if pt.get("speech_active") else "FALSE",
                pt.get("face_count", ""),
                "TRUE" if pt.get("visual_active") else "FALSE",
                pt.get("point_engagement_score", 0.0)
            ])

        return output.getvalue()

    @staticmethod
    def generate_comprehensive_report_markdown(
        session: Dict[str, Any],
        attendance_stats: Dict[str, Any],
        audio_stats: Optional[Dict[str, Any]],
        video_stats: Optional[Dict[str, Any]],
        engagement_stats: Optional[Dict[str, Any]]
    ) -> str:
        """Builds a comprehensive audit report in Markdown format."""
        lines = []
        lines.append(f"# Classroom Multimodal Session Report: {session.get('title')}")
        lines.append(f"**Session Code**: `{session.get('session_code')}` | **Course**: {session.get('course_name')}")
        lines.append(f"**Instructor**: {session.get('instructor_name')} | **Status**: {session.get('status')}")
        lines.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        lines.append("\n---\n")

        # 1. Attendance Summary
        lines.append("## 1. Attendance Register Summary")
        lines.append(f"- **Total Enrolled Students**: {attendance_stats.get('total_enrolled', 0)}")
        lines.append(f"- **Present**: {attendance_stats.get('present_count', 0)}")
        lines.append(f"- **Absent**: {attendance_stats.get('absent_count', 0)}")
        lines.append(f"- **Attendance Rate**: {attendance_stats.get('attendance_rate', 0.0)}%")
        lines.append("- **Verification Mode**: Authorized Manual / Consent-Verified (No automatic face-tagging applied)")
        lines.append("\n")

        # 2. Audio Analysis
        lines.append("## 2. Acoustic Signal Analysis (Activity 3.1)")
        if audio_stats and audio_stats.get("status") == "COMPLETED":
            lines.append(f"- **File Analyzed**: `{audio_stats.get('filename')}`")
            lines.append(f"- **Duration**: {audio_stats.get('duration_seconds')} seconds")
            lines.append(f"- **Original Format**: {audio_stats.get('original_channels')} ch @ {audio_stats.get('original_sample_rate')} Hz")
            lines.append(f"- **Processed Format**: {audio_stats.get('processed_channels')} ch @ {audio_stats.get('processed_sample_rate')} Hz")
            lines.append(f"- **Mean RMS Energy**: {audio_stats.get('rms_energy_mean')}")
            lines.append(f"- **Estimated Speech Ratio**: {round(audio_stats.get('speech_ratio', 0.0) * 100, 1)}%")
            lines.append(f"- **Estimated Silence Ratio**: {round(audio_stats.get('silence_ratio', 0.0) * 100, 1)}%")
        else:
            lines.append("*No audio recording or analysis completed for this session.*")
        lines.append("\n")

        # 3. Vision Analysis
        lines.append("## 3. Computer Vision Analysis")
        if video_stats and video_stats.get("status") == "COMPLETED":
            lines.append(f"- **Video File**: `{video_stats.get('filename')}`")
            lines.append(f"- **Video Resolution**: {video_stats.get('width')}x{video_stats.get('height')} @ {video_stats.get('fps')} FPS")
            lines.append(f"- **Sampled Frames**: {video_stats.get('sampled_frames_count')} (every {video_stats.get('sampling_interval_seconds')}s)")
            lines.append(f"- **Average Visible Faces**: {video_stats.get('average_face_count')}")
            lines.append(f"- **Peak Visible Faces**: {video_stats.get('max_face_count')}")
            lines.append(f"- **Detection Method**: {video_stats.get('detection_method')}")
        else:
            lines.append("*No video recording or vision analysis completed for this session.*")
        lines.append("\n")

        # 4. Engagement Analysis
        lines.append("## 4. Multimodal Engagement Synthesis")
        if engagement_stats:
            score = engagement_stats.get("overall_engagement_score", 0.0)
            lines.append(f"- **Overall Engagement Index**: **{score} / 100**")
            lines.append(f"- **Visual Presence Index**: {engagement_stats.get('visual_indicator_score', 0.0)} / 100")
            lines.append(f"- **Acoustic Activity Index**: {engagement_stats.get('audio_indicator_score', 0.0)} / 100")
            lines.append(f"- **Algorithm Version**: `{engagement_stats.get('formula_version', 'v1.0')}`")
            
            exp = engagement_stats.get("explainability", {})
            if exp:
                lines.append("\n### Explainability Breakdown")
                lines.append(f"- **Formula**: {exp.get('formula_name', 'Linear Heuristic Fusion')}")
                lines.append(f"- **Features Used**: {', '.join(exp.get('features_used', []))}")
                lines.append(f"- **Guideline**: {exp.get('interpretation_guide', '')}")
            
            warnings = engagement_stats.get("warnings", [])
            if warnings:
                lines.append("\n### Data Quality Warnings")
                for w in warnings:
                    lines.append(f"- ⚠️ {w}")
        else:
            lines.append("*Multimodal engagement has not yet been computed for this session.*")
        lines.append("\n")

        # 5. Ethical & Technical Limitations
        lines.append("## 5. Technical Limitations & Ethical Privacy Notice")
        lines.append(
            "1. **Identity Integrity**: Computer vision face detection counts detected faces within "
            "camera line-of-sight. It is never used to secretly associate identities without consent.\n"
            "2. **Acoustic Nuance**: RMS energy and zero-crossing speech estimation measure physical "
            "amplitude and frequency transitions. They do not transcribe speech or judge classroom pedagogical value.\n"
            "3. **Engagement Disclaimer**: Engagement scores represent observable multimodal activity proxies, "
            "not psychological comprehension, affective mood, or academic aptitude."
        )

        return "\n".join(lines)

report_service = ReportService()
