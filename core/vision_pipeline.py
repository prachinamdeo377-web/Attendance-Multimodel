import os
import cv2
import numpy as np
import base64
from typing import List, Dict, Any, Tuple, Optional
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
FACE_DETECTOR_MODEL = os.path.join(MODELS_DIR, "blaze_face_short_range.tflite")
FACE_LANDMARKER_MODEL = os.path.join(MODELS_DIR, "face_landmarker.task")
HAAR_CASCADE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "app", "assets", "haarcascade_frontalface_default.xml")


class VisionPipeline:
    def __init__(self):
        self.detector = None
        self.landmarker = None
        self._init_mediapipe_detector()
        self._init_mediapipe_landmarker()
        
        # Backup OpenCV Haar Cascade
        self.haar_cascade = None
        if os.path.exists(HAAR_CASCADE_PATH):
            self.haar_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)

    def _init_mediapipe_detector(self):
        try:
            if os.path.exists(FACE_DETECTOR_MODEL):
                base_options = python.BaseOptions(model_asset_path=FACE_DETECTOR_MODEL)
                options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.45)
                self.detector = vision.FaceDetector.create_from_options(options)
        except Exception as e:
            print(f"VisionPipeline: MediaPipe detector initialization warning: {e}")
            self.detector = None

    def _init_mediapipe_landmarker(self):
        try:
            if os.path.exists(FACE_LANDMARKER_MODEL):
                base_options = python.BaseOptions(model_asset_path=FACE_LANDMARKER_MODEL)
                options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=10)
                self.landmarker = vision.FaceLandmarker.create_from_options(options)
        except Exception as e:
            print(f"VisionPipeline: MediaPipe landmarker initialization warning: {e}")
            self.landmarker = None

    def process_image(self, image_bgr: np.ndarray) -> Tuple[np.ndarray, List[Dict[str, Any]], float]:
        """
        Detects faces using MediaPipe & OpenCV, draws annotations, and calculates attention vitality.
        Returns: (annotated_image, detections_list, attention_score)
        """
        if image_bgr is None or image_bgr.size == 0:
            return image_bgr, [], 0.0

        h, w = image_bgr.shape[:2]
        annotated = image_bgr.copy()
        detections = []
        forward_facing_count = 0

        # Primary: MediaPipe Tasks FaceDetector
        if self.detector is not None:
            try:
                rgb_img = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
                mp_result = self.detector.detect(mp_img)

                for idx, det in enumerate(mp_result.detections):
                    score = det.categories[0].score if det.categories else 0.95
                    bbox = det.bounding_box
                    x = max(0, int(bbox.origin_x))
                    y = max(0, int(bbox.origin_y))
                    box_w = min(w - x, int(bbox.width))
                    box_h = min(h - y, int(bbox.height))

                    # Keypoints (eyes, nose, mouth, ears)
                    kps = []
                    for kp in det.keypoints:
                        kx = int(kp.x * w)
                        ky = int(kp.y * h)
                        kps.append({"x": kx, "y": ky})

                    # Calculate head orientation heuristic from keypoints
                    # 0: right eye, 1: left eye, 2: nose tip
                    is_forward = True
                    if len(kps) >= 3:
                        re, le, nose = kps[0], kps[1], kps[2]
                        eye_mid_x = (re["x"] + le["x"]) / 2.0
                        eye_dist = abs(re["x"] - le["x"])
                        if eye_dist > 5:
                            nose_offset = abs(nose["x"] - eye_mid_x) / eye_dist
                            if nose_offset < 0.35:
                                is_forward = True
                                forward_facing_count += 1
                            else:
                                is_forward = False
                    else:
                        forward_facing_count += 1

                    detections.append({
                        "id": idx + 1,
                        "x": x,
                        "y": y,
                        "width": box_w,
                        "height": box_h,
                        "confidence": round(float(score), 3),
                        "facing_forward": is_forward,
                        "keypoints": kps
                    })

                    # Draw annotated overlay using OpenCV
                    color = (46, 204, 113) if is_forward else (52, 152, 219)  # Green if facing forward, Blue otherwise
                    cv2.rectangle(annotated, (x, y), (x + box_w, y + box_h), color, 2)
                    
                    label = f"Face #{idx+1} ({int(score*100)}%)"
                    cv2.putText(annotated, label, (x, max(20, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

                    for kp in kps:
                        cv2.circle(annotated, (kp["x"], kp["y"]), 3, (0, 255, 255), -1)

            except Exception as e:
                print(f"MediaPipe detection fallback: {e}")

        # Fallback to OpenCV Haar Cascade if MediaPipe returned 0 or wasn't loaded
        if len(detections) == 0 and self.haar_cascade is not None:
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            faces = self.haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            for idx, (x, y, fw, fh) in enumerate(faces):
                detections.append({
                    "id": idx + 1,
                    "x": int(x),
                    "y": int(y),
                    "width": int(fw),
                    "height": int(fh),
                    "confidence": 0.88,
                    "facing_forward": True,
                    "keypoints": []
                })
                forward_facing_count += 1
                cv2.rectangle(annotated, (x, y), (x + fw, y + fh), (46, 204, 113), 2)
                cv2.putText(annotated, f"Attendee #{idx+1}", (x, max(20, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (46, 204, 113), 2)

        total_faces = len(detections)
        if total_faces > 0:
            attention_score = round((forward_facing_count / total_faces) * 100.0, 1)
        else:
            attention_score = 0.0

        return annotated, detections, attention_score

    def process_video_file(self, video_path: str, sample_interval_sec: float = 1.0) -> Dict[str, Any]:
        """
        Samples video frames at configured intervals using OpenCV, runs MediaPipe face detector,
        and aggregates presence density metrics over time.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video source: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if total_frames > 0 else 0.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        frame_step = max(1, int(round(fps * sample_interval_sec)))
        timeline = []
        preview_snapshots = []
        face_counts = []
        current_frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if current_frame_idx % frame_step == 0:
                timestamp_sec = round(current_frame_idx / fps, 2)
                annotated_frame, detections, attention = self.process_image(frame)
                count = len(detections)
                face_counts.append(count)

                timeline.append({
                    "timestamp_sec": timestamp_sec,
                    "face_count": count,
                    "attention_score": attention
                })

                # Capture up to 6 representative preview thumbnails
                if len(preview_snapshots) < 6 or (count > 0 and len(preview_snapshots) < 12):
                    thumb = cv2.resize(annotated_frame, (320, int(320 * height / max(width, 1))))
                    _, buffer = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    b64_str = base64.b64encode(buffer).decode("utf-8")
                    preview_snapshots.append({
                        "timestamp_sec": timestamp_sec,
                        "face_count": count,
                        "attention": attention,
                        "image_base64": b64_str
                    })

            current_frame_idx += 1

        cap.release()

        avg_faces = float(np.mean(face_counts)) if face_counts else 0.0
        max_faces = int(np.max(face_counts)) if face_counts else 0
        min_faces = int(np.min(face_counts)) if face_counts else 0

        return {
            "duration_seconds": round(duration, 2),
            "fps": round(fps, 2),
            "width": width,
            "height": height,
            "sampled_frames_count": len(timeline),
            "sampling_interval_seconds": sample_interval_sec,
            "average_face_count": round(avg_faces, 2),
            "max_face_count": max_faces,
            "min_face_count": min_faces,
            "timeline": timeline,
            "preview_snapshots": preview_snapshots,
            "detection_method": "MediaPipe BlazeFace + OpenCV"
        }


# Singleton pipeline instance
vision_pipeline = VisionPipeline()
