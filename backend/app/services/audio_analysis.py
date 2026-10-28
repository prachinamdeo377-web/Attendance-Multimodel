import os
import io
import math
import logging
import numpy as np
import soundfile as sf
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Try importing librosa, with soundfile/scipy fallback if unavailable
try:
    import librosa
    HAS_LIBROSA = True
except Exception as e:
    logger.warning(f"Librosa import failed or unavailable ({e}); falling back to soundfile/scipy.")
    HAS_LIBROSA = False
    import scipy.signal

class AudioAnalyzer:
    """
    Multimodal Classroom Audio Signal Processing Module.
    Extracts time-frequency acoustic characteristics, segment-level RMS energy,
    downsampled waveforms for UI visualization, and acoustic speech-activity estimations.

    DISCLAIMER:
    RMS energy measures physical signal amplitude / acoustic power.
    Speech activity estimation uses acoustic energy and zero-crossing rate heuristics;
    it does NOT transcribe words, identify speakers, or assess comprehension.
    """

    def __init__(
        self,
        target_sample_rate: int = 16000,
        segment_duration_seconds: float = 2.0,
        energy_threshold_multiplier: float = 1.3,
        min_silence_rms: float = 0.005,
        zcr_threshold: float = 0.05
    ):
        self.target_sample_rate = target_sample_rate
        self.segment_duration_seconds = segment_duration_seconds
        self.energy_threshold_multiplier = energy_threshold_multiplier
        self.min_silence_rms = min_silence_rms
        self.zcr_threshold = zcr_threshold

    def load_audio(self, file_path_or_bytes) -> Tuple[np.ndarray, int, int]:
        """
        Loads audio from a filepath or in-memory byte buffer.
        Returns:
            waveform (np.ndarray): mono normalized float32 array [-1.0, 1.0]
            original_sample_rate (int)
            original_channels (int)
        """
        original_sr = self.target_sample_rate
        original_channels = 1

        if isinstance(file_path_or_bytes, bytes):
            buffer = io.BytesIO(file_path_or_bytes)
            data, sr = sf.read(buffer, dtype='float32')
        else:
            if not os.path.exists(file_path_or_bytes):
                raise FileNotFoundError(f"Audio file not found: {file_path_or_bytes}")
            data, sr = sf.read(file_path_or_bytes, dtype='float32')

        original_sr = sr
        if data.ndim == 2:
            original_channels = data.shape[1]
            # Convert multi-channel to mono via channel averaging
            data = np.mean(data, axis=1)
        elif data.ndim == 1:
            original_channels = 1
        else:
            raise ValueError(f"Unsupported audio channel dimension: {data.ndim}")

        # Resample to target sample rate if needed
        if sr != self.target_sample_rate:
            if HAS_LIBROSA:
                data = librosa.resample(data, orig_sr=sr, target_sr=self.target_sample_rate)
            else:
                num_samples = int(len(data) * float(self.target_sample_rate) / sr)
                data = scipy.signal.resample(data, num_samples)

        # Normalize amplitude to [-1.0, 1.0] if dynamic range allows
        max_amp = np.max(np.abs(data)) if len(data) > 0 else 0
        if max_amp > 1e-6:
            data = data / max_amp

        return data.astype(np.float32), original_sr, original_channels

    def calculate_rms(self, frame: np.ndarray) -> float:
        """Computes Root Mean Square (RMS) energy for an array slice."""
        if len(frame) == 0:
            return 0.0
        return float(np.sqrt(np.mean(np.square(frame))))

    def calculate_zero_crossing_rate(self, frame: np.ndarray) -> float:
        """Calculates zero-crossing rate as an indicator of high-frequency / speech consonant content."""
        if len(frame) <= 1:
            return 0.0
        zero_crossings = np.sum(np.abs(np.diff(np.sign(frame) >= 0)))
        return float(zero_crossings / len(frame))

    def downsample_waveform_for_ui(self, audio_data: np.ndarray, num_points: int = 150) -> List[float]:
        """
        Downsamples the continuous audio waveform into `num_points` peak envelopes
        for responsive and fast frontend SVG/Canvas rendering.
        """
        if len(audio_data) == 0:
            return [0.0] * num_points

        chunk_size = max(1, len(audio_data) // num_points)
        peaks = []
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i:i + chunk_size]
            if len(chunk) > 0:
                peaks.append(round(float(np.max(np.abs(chunk))), 4))
            if len(peaks) >= num_points:
                break
        while len(peaks) < num_points:
            peaks.append(0.0)
        return peaks[:num_points]

    def analyze(self, file_path_or_bytes, filename: str = "audio.wav") -> Dict[str, Any]:
        """
        Executes complete Activity 3.1 audio signal processing pipeline.
        """
        try:
            audio_data, original_sr, original_channels = self.load_audio(file_path_or_bytes)
        except Exception as e:
            logger.error(f"Failed to decode audio file {filename}: {e}")
            return {
                "filename": filename,
                "duration_seconds": 0.0,
                "original_sample_rate": 0,
                "processed_sample_rate": self.target_sample_rate,
                "original_channels": 0,
                "processed_channels": 1,
                "rms_energy_mean": 0.0,
                "speech_ratio": 0.0,
                "silence_ratio": 1.0,
                "segments": [],
                "waveform_downsampled": [],
                "status": "FAILED",
                "error_message": f"Audio decode failed: {str(e)}"
            }

        total_samples = len(audio_data)
        duration_sec = total_samples / float(self.target_sample_rate)

        if total_samples == 0 or duration_sec < 0.05:
            return {
                "filename": filename,
                "duration_seconds": 0.0,
                "original_sample_rate": original_sr,
                "processed_sample_rate": self.target_sample_rate,
                "original_channels": original_channels,
                "processed_channels": 1,
                "rms_energy_mean": 0.0,
                "speech_ratio": 0.0,
                "silence_ratio": 1.0,
                "segments": [],
                "waveform_downsampled": [0.0] * 100,
                "status": "COMPLETED",
                "error_message": "Audio file contains zero or negligible samples."
            }

        # Divide into configurable fixed-duration segments
        samples_per_segment = int(self.segment_duration_seconds * self.target_sample_rate)
        num_segments = math.ceil(total_samples / float(samples_per_segment))

        segment_results: List[Dict[str, Any]] = []
        segment_rms_values: List[float] = []

        # Pass 1: Extract RMS and ZCR per segment
        raw_segment_stats = []
        for i in range(num_segments):
            start_idx = i * samples_per_segment
            end_idx = min(total_samples, (i + 1) * samples_per_segment)
            segment_slice = audio_data[start_idx:end_idx]

            start_sec = round(start_idx / float(self.target_sample_rate), 2)
            end_sec = round(end_idx / float(self.target_sample_rate), 2)

            rms = self.calculate_rms(segment_slice)
            zcr = self.calculate_zero_crossing_rate(segment_slice)

            segment_rms_values.append(rms)
            raw_segment_stats.append({
                "start_seconds": start_sec,
                "end_seconds": end_sec,
                "rms_energy": round(rms, 4),
                "zcr": round(zcr, 4)
            })

        # Calculate baseline background acoustic floor
        baseline_noise_floor = float(np.percentile(segment_rms_values, 20)) if segment_rms_values else 0.0
        adaptive_speech_threshold = max(
            self.min_silence_rms,
            baseline_noise_floor * self.energy_threshold_multiplier
        )

        speech_segments_count = 0
        for seg in raw_segment_stats:
            # Acoustic speech activity heuristic:
            # RMS exceeds adaptive ambient noise floor AND reasonable zero crossing rate
            is_speech = (seg["rms_energy"] >= adaptive_speech_threshold) and (seg["zcr"] >= self.zcr_threshold)
            if is_speech:
                speech_segments_count += 1

            segment_results.append({
                "start_seconds": seg["start_seconds"],
                "end_seconds": seg["end_seconds"],
                "rms_energy": seg["rms_energy"],
                "speech_activity": bool(is_speech)
            })

        mean_rms = float(np.mean(segment_rms_values)) if segment_rms_values else 0.0
        speech_ratio = float(speech_segments_count / max(1, len(segment_results)))
        silence_ratio = float(1.0 - speech_ratio)

        waveform_points = self.downsample_waveform_for_ui(audio_data, num_points=120)

        return {
            "filename": filename,
            "duration_seconds": round(duration_sec, 2),
            "original_sample_rate": original_sr,
            "processed_sample_rate": self.target_sample_rate,
            "original_channels": original_channels,
            "processed_channels": 1,
            "rms_energy_mean": round(mean_rms, 4),
            "speech_ratio": round(speech_ratio, 3),
            "silence_ratio": round(silence_ratio, 3),
            "segments": segment_results,
            "waveform_downsampled": waveform_points,
            "status": "COMPLETED",
            "error_message": None
        }

audio_analyzer = AudioAnalyzer()
