# Multimodal Attendance & Engagement Agent

[![Python](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.40+-FF4B4B.svg)](https://streamlit.io/)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-5C3EE8.svg)](https://opencv.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Detection%20%26%20Landmarks-00C4B4.svg)](https://developers.google.com/mediapipe)
[![Librosa](https://img.shields.io/badge/Librosa-Audio%20Signal%20Processing-orange.svg)](https://librosa.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end multimodal Artificial Intelligence system designed for smart classroom telemetry, attendance management, and explainable student engagement synthesis. Built with **Streamlit, OpenCV, MediaPipe, Librosa, and Python 3.9+** for academic technical evaluation, viva presentations, and practical laboratory demonstrations.

---

## 1. Project Overview & Core Technologies

The **Multimodal Attendance & Engagement Agent** combines five core technologies to run both the interface and intelligent pipelines on a single unified link:

| Technology | Role & Purpose |
| :--- | :--- |
| **Streamlit** | Full-stack interactive web application dashboard served seamlessly on **one single link** (`http://localhost:8501`). |
| **OpenCV (`cv2`)** | Video frame extraction, bounding box rendering, image pre-processing, and visual telemetry overlays. |
| **MediaPipe** | Blazing-fast LiteRT Face Detection (BlazeFace) and Face Landmarking to track visible attendees, eye keypoints, and head orientation attention. |
| **Librosa** | **Activity 3.1 Audio Signal Processing Pipeline**: 16 kHz sample rate normalization, mono conversion, 2.0s windowing, Root Mean Square (RMS) energy, and speech-vs-silence heuristics. |
| **Python 3.9+** | Native cross-platform execution (supports Python 3.9, 3.10, 3.11, 3.12, and 3.13). |

---

## 2. Key Capabilities

### 🎵 Activity 3.1: Librosa Acoustic Signal Processing
- **Sample Rate Normalization**: Automatically converts stereo/multi-channel input to mono and normalizes audio to 16,000 Hz.
- **Window Segmentation**: Partitions continuous classroom audio into 2.0-second discrete observation windows.
- **RMS Energy Extraction**: Computes Root Mean Square (RMS) energy for each temporal segment.
- **Speech vs Silence Detection**: Compares segment energy against a configurable silence threshold to quantify classroom conversational participation.
- **Waveform & Energy Plotting**: Generates peak-envelope waveforms and RMS bar charts.
- **1-Click Synthetic Tone Generator**: Built-in 4-second sinusoidal audio generator (440 Hz speech-like modulated waveform) for testing without external files.

### 📹 OpenCV & MediaPipe Computer Vision Analytics
- **LiteRT Face Detection**: MediaPipe BlazeFace detects all visible faces with high confidence and minimal latency.
- **Head Orientation & Attention Heuristics**: Evaluates nose and eye keypoints to determine whether attendees are actively oriented toward the instruction area.
- **Temporal Video Sampling**: Samples recorded classroom video (`.mp4`, `.mov`, `.avi`, `.webm`) at 1.0-second intervals to compute attendee density over time.
- **Annotated Snapshot Previews**: Automatically annotates frames with colored bounding boxes and landmark points.

### 📋 Auditable Attendance Register
- **Roster Check-Ins**: Consent-authorized student roster attendance management.
- **Status Controls**: Toggle between **PRESENT**, **LATE**, and **ABSENT**.
- **1-Click Mark All Present**: Rapid batch check-in for classroom convenience.
- **RFC 4180 CSV Export**: Generates compliant CSV attendance sheets ready for university LMS import.

### 📈 Explainable Multimodal Engagement Synthesis
- **Transparent Mathematical Fusion**:
  $$\text{Engagement} = (0.45 \times \text{Visual Presence}) + (0.35 \times \text{Acoustic Vitality}) + (0.20 \times \text{Attendance Ratio})$$
- **No Black-Box Psychological Claims**: The model functions as an ethical telemetry indicator measuring observable presence and activity, not private emotions.
- **Synchronized Telemetry Trajectory**: Interactive multi-series charts showing temporal dynamics across the entire session.

---

## 3. Project Structure

```
attendance-multimodel/
├── streamlit_app.py            # Master Streamlit web application
├── run_app.bat                 # 1-Click launcher for Windows
├── run_app.sh                  # 1-Click launcher for Linux/macOS
├── start_all.bat               # Unified starter batch file
├── requirements.txt            # Streamlit, OpenCV, MediaPipe, Librosa dependencies
├── core/
│   ├── database.py             # SQLite relational database (Students, Sessions, Attendance)
│   ├── vision_pipeline.py      # OpenCV + MediaPipe face detection & landmark pipeline
│   ├── audio_pipeline.py       # Librosa Activity 3.1 acoustic normalization & RMS processor
│   ├── engagement_fusion.py    # Multimodal weighted fusion algorithm
│   └── demo_data.py            # 1-Click seed data for immediate demonstration
├── models/
│   ├── blaze_face_short_range.tflite # Bundled MediaPipe Face Detector model
│   └── face_landmarker.task          # Bundled MediaPipe Face Landmarker model
├── backend/                    # Optional REST API backend (FastAPI)
└── frontend/                   # Optional React 19 Single Page Application
```

---

## 4. Quick Start: How to Run the Project

### Method 1: 1-Click Launcher (Windows)
Double-click [`run_app.bat`](run_app.bat) or run from PowerShell:
```powershell
.\run_app.bat
```

### Method 2: Command Line
From the project root:
```powershell
# 1. Activate virtual environment (if not already active)
.\venv\Scripts\activate

# 2. Run the Streamlit application
streamlit run streamlit_app.py
```

The web application opens automatically at **`http://localhost:8501`**.

---

## 5. Step-by-Step Installation Guide (From Scratch)

If setting up on a new computer:

```bash
# 1. Clone repository
git clone https://github.com/prachinamdeo377-web/Attendance-Multimodel.git
cd Attendance-Multimodel

# 2. Create Python virtual environment (Python 3.9 - 3.13)
python -m venv venv

# 3. Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Launch the application
streamlit run streamlit_app.py
```

---

## 6. How to Test Each Feature During a Viva / Demonstration

1. **Seed Demo Data**:
   - Open the web app at `http://localhost:8501`.
   - In the left sidebar, click **"🌱 Seed Sample Demo Data"**.
   - 12 students and 3 realistic classroom sessions will be populated instantly.

2. **Test Live Attendance & MediaPipe**:
   - Navigate to **"📹 Live Camera & MediaPipe Vision"**.
   - Capture a camera photo with **Webcam Snapshot** or upload an image.
   - Inspect detected faces, bounding boxes, and attention score.
   - Click **"✅ Mark All Present"** to log attendance into the database.

3. **Test Activity 3.1 Audio Signal Processing (Librosa)**:
   - Navigate to **"🎵 Audio Analysis (Librosa 3.1)"**.
   - Click **"⚡ Generate 1-Click Synthetic Audio (440Hz)"** or upload any `.wav`/`.mp3` file.
   - View 16 kHz resampled duration, mean RMS energy, peak waveform, and numerical 2.0s segments.
   - Click **"📥 Download Acoustic Segments CSV"**.

4. **Test Video Presence (OpenCV + MediaPipe)**:
   - Navigate to **"🎬 Video Presence Analysis"**.
   - Upload any classroom video (`.mp4`, `.mov`, `.avi`).
   - Observe 1.0s sampled timeline density and keyframe gallery.

5. **Export Attendance CSV**:
   - Navigate to **"📋 Attendance Register & CSV"**.
   - Select any session and click **"📥 Export RFC 4180 CSV"**.

6. **Inspect Engagement Synthesis**:
   - Navigate to **"📈 Multimodal Engagement Synthesis"**.
   - Adjust visual/acoustic sliders to observe explainable real-time weighted scoring.

---

## 7. Ethical Governance & Privacy Compliance

- **Anonymous Presence Counting**: MediaPipe and OpenCV process face geometry anonymously; faces are never secretly matched to identity without explicit consent.
- **Local-First Execution**: Audio and video telemetry remain entirely on the local device; zero data is transmitted to external cloud servers.
- **Explainable Metric Formulation**: Clearly communicates that participation vitality reflects observable classroom signals rather than internal emotional state.

---

## 8. License

Distributed under the **MIT License**.
