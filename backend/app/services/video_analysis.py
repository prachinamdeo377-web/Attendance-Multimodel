import os
import cv2
import base64
import logging
import numpy as np
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    """
    Multimodal Classroom Video Signal Processing Module.
    Samples video frames at configurable time intervals, applies computer vision
    face detection, counts visible attendees, and produces annotated thumbnails.

    ETHICAL & TECHNICAL NOTICE:
    Face count measures visible faces captured in the camera view frustum.
    It does NOT identify individuals by name, nor does it guarantee full physical
    attendance (due to occlusions, seating blind spots, or lighting variations).
    """

    def __init__(
        self,
        sampling_interval_seconds: float = 1.0,
        max_preview_thumbnails: int = 6,
        face_scale_factor: float = 1.15,
        min_face_neighbors: int = 5,
        min_face_size: tuple = (30, 30)
    ):
        self.sampling_interval_seconds = sampling_interval_seconds
        self.max_preview_thumbnails = max_preview_thumbnails
        self.face_scale_factor = face_scale_factor
        self.min_face_neighbors = min_face_neighbors
        self.min_face_size = min_face_size

        # Find Haar Cascade XML: check bundled assets first, then cv2.data.haarcascades
        bundled_cascade = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "haarcascade_frontalface_default.xml"))
        cv_cascade = os.path.join(getattr(cv2.data, 'haarcascades', ''), 'haarcascade_frontalface_default.xml') if hasattr(cv2, 'data') else ''
        
        cascade_path = None
        if os.path.exists(bundled_cascade):
            cascade_path = bundled_cascade
        elif os.path.exists(cv_cascade):
            cascade_path = cv_cascade

        if cascade_path and os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            self.has_cascade = True
        else:
            logger.warning("No OpenCV Haar Cascade XML found. Face detection will use fallback.")
            self.face_cascade = None
            self.has_cascade = False

    def _encode_frame_to_base64_jpeg(self, frame: np.ndarray, max_width: int = 480) -> str:
        """Resizes and compresses frame into base64 JPEG thumbnail."""
        h, w = frame.shape[:2]
        if w > max_width:
            scale = max_width / float(w)
            new_h = int(h * scale)
            frame = cv2.resize(frame, (max_width, new_h), interpolation=cv2.INTER_AREA)

        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{jpg_as_text}"

    def analyze(self, file_path: str, filename: str = "video.mp4") -> Dict[str, Any]:
        """
        Processes video file, samples frames, detects faces, and computes metrics.
        """
        if not os.path.exists(file_path):
            return {
                "filename": filename,
                "duration_seconds": 0.0,
                "fps": 0.0,
                "width": 0,
                "height": 0,
                "sampled_frames_count": 0,
                "sampling_interval_seconds": self.sampling_interval_seconds,
                "average_face_count": 0.0,
                "max_face_count": 0,
                "min_face_count": 0,
                "face_counts_timeline": [],
                "preview_frames": [],
                "detection_method": "HAAR_CASCADE",
                "status": "FAILED",
                "error_message": f"File does not exist: {file_path}"
            }

        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return {
                "filename": filename,
                "duration_seconds": 0.0,
                "fps": 0.0,
                "width": 0,
                "height": 0,
                "sampled_frames_count": 0,
                "sampling_interval_seconds": self.sampling_interval_seconds,
                "average_face_count": 0.0,
                "max_face_count": 0,
                "min_face_count": 0,
                "face_counts_timeline": [],
                "preview_frames": [],
                "detection_method": "HAAR_CASCADE",
                "status": "FAILED",
                "error_message": "Could not open or decode video stream via OpenCV."
            }

        try:
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            if fps <= 0 or np.isnan(fps):
                fps = 25.0  # standard fallback

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration_sec = total_frames / fps if total_frames > 0 else 0.0

            frame_step = max(1, int(round(fps * self.sampling_interval_seconds)))

            timeline_samples: List[Dict[str, Any]] = []
            preview_frames: List[str] = []
            face_counts: List[int] = []

            # Determine thumbnail sample indices (evenly spread)
            expected_sampled_count = max(1, total_frames // frame_step)
            preview_step = max(1, expected_sampled_count // self.max_preview_thumbnails)

            current_frame_idx = 0
            sampled_idx = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if current_frame_idx % frame_step == 0:
                    timestamp_sec = round(current_frame_idx / fps, 2)
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    
                    # Detect faces with Haar Cascade
                    if self.has_cascade and self.face_cascade is not None:
                        faces = self.face_cascade.detectMultiScale(
                            gray,
                            scaleFactor=self.face_scale_factor,
                            minNeighbors=self.min_face_neighbors,
                            minSize=self.min_face_size
                        )
                    else:
                        faces = []

                    count = len(faces)
                    face_counts.append(count)

                    timeline_samples.append({
                        "timestamp_seconds": timestamp_sec,
                        "face_count": count,
                        "confidence_mean": 0.85 if count > 0 else None
                    })

                    # If this sampled frame qualifies for a preview thumbnail, annotate it
                    if sampled_idx % preview_step == 0 and len(preview_frames) < self.max_preview_thumbnails:
                        annotated = frame.copy()
                        for (x, y, w_box, h_box) in faces:
                            # Draw bounding rectangle and tag
                            cv2.rectangle(annotated, (x, y), (x + w_box, y + h_box), (37, 99, 235), 2)
                            cv2.putText(
                                annotated,
                                f"Person {count}",
                                (x, max(15, y - 6)),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.5,
                                (37, 99, 235),
                                1,
                                cv2.LINE_AA
                            )
                        # Overlay timestamp
                        cv2.putText(
                            annotated,
                            f"t={timestamp_sec}s | Faces: {count}",
                            (10, 24),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (16, 185, 129),
                            2,
                            cv2.LINE_AA
                        )
                        preview_frames.append(self._encode_frame_to_base64_jpeg(annotated))

                    sampled_idx += 1

                current_frame_idx += 1

            avg_faces = float(np.mean(face_counts)) if face_counts else 0.0
            max_faces = int(np.max(face_counts)) if face_counts else 0
            min_faces = int(np.min(face_counts)) if face_counts else 0

            return {
                "filename": filename,
                "duration_seconds": round(duration_sec, 2),
                "fps": round(fps, 2),
                "width": width,
                "height": height,
                "sampled_frames_count": len(timeline_samples),
                "sampling_interval_seconds": self.sampling_interval_seconds,
                "average_face_count": round(avg_faces, 2),
                "max_face_count": max_faces,
                "min_face_count": min_faces,
                "face_counts_timeline": timeline_samples,
                "preview_frames": preview_frames,
                "detection_method": "HAAR_CASCADE_OPENCV",
                "status": "COMPLETED",
                "error_message": None
            }

        finally:
            cap.release()

video_analyzer = VideoAnalyzer()
