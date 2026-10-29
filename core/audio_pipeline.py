import os
import io
import soundfile as sf
import numpy as np
import librosa
from typing import Dict, Any, List, Tuple


class AudioPipeline:
    def __init__(
        self,
        target_sample_rate: int = 16000,
        segment_duration_sec: float = 2.0,
        silence_threshold_rms: float = 0.015
    ):
        self.target_sample_rate = target_sample_rate
        self.segment_duration_sec = segment_duration_sec
        self.silence_threshold_rms = silence_threshold_rms

    def process_audio(
        self,
        audio_source: Any,
        original_filename: str = "recording.wav"
    ) -> Dict[str, Any]:
        """
        Activity 3.1: Complete Acoustic Signal Processing Pipeline
        - Loads audio via Librosa
        - Converts stereo to mono
        - Normalizes to 16,000 Hz
        - Windows into 2.0-second segments
        - Extracts Root Mean Square (RMS) energy & speech activity
        """
        # Load audio using librosa
        if isinstance(audio_source, (str, bytes, io.BytesIO)):
            if isinstance(audio_source, bytes):
                audio_source = io.BytesIO(audio_source)
            y, sr = librosa.load(audio_source, sr=None, mono=False)
        else:
            raise ValueError("Unsupported audio input format")

        orig_channels = 1 if y.ndim == 1 else y.shape[0]
        orig_sr = sr

        # Convert to mono if multi-channel
        if y.ndim > 1:
            y_mono = librosa.to_mono(y)
        else:
            y_mono = y

        # Resample to 16,000 Hz
        if orig_sr != self.target_sample_rate:
            y_resampled = librosa.resample(y_mono, orig_sr=orig_sr, target_sr=self.target_sample_rate)
        else:
            y_resampled = y_mono

        total_samples = len(y_resampled)
        duration_sec = total_samples / self.target_sample_rate
        segment_samples = int(self.segment_duration_sec * self.target_sample_rate)

        # Windowing & RMS Feature Extraction
        segments: List[Dict[str, Any]] = []
        speech_segments_count = 0
        total_segments = max(1, int(np.ceil(total_samples / segment_samples)))

        for i in range(total_segments):
            start_idx = i * segment_samples
            end_idx = min(start_idx + segment_samples, total_samples)
            seg_data = y_resampled[start_idx:end_idx]

            if len(seg_data) == 0:
                continue

            # Segment RMS energy: sqrt(mean(x^2))
            seg_rms = float(np.sqrt(np.mean(seg_data ** 2)))
            
            # Zero-Crossing Rate
            zcr = float(np.mean(librosa.feature.zero_crossing_rate(seg_data)))

            is_speech = seg_rms >= self.silence_threshold_rms
            if is_speech:
                speech_segments_count += 1

            start_t = round(start_idx / self.target_sample_rate, 2)
            end_t = round(end_idx / self.target_sample_rate, 2)

            segments.append({
                "segment_index": i + 1,
                "start_time_sec": start_t,
                "end_time_sec": end_t,
                "duration_sec": round(end_t - start_t, 2),
                "rms_energy": round(seg_rms, 5),
                "zero_crossing_rate": round(zcr, 4),
                "is_speech": is_speech,
                "classification": "SPEECH" if is_speech else "SILENCE/AMBIENT"
            })

        mean_rms = float(np.mean([s["rms_energy"] for s in segments])) if segments else 0.0
        speech_ratio = round(speech_segments_count / max(1, len(segments)), 3)
        silence_ratio = round(1.0 - speech_ratio, 3)

        # Downsample waveform for high-speed SVG / LineChart visualization (~100 points)
        downsample_factor = max(1, total_samples // 120)
        downsampled_waveform = [
            round(float(v), 4) for v in y_resampled[::downsample_factor][:120]
        ]

        # Calculate explainable acoustic vitality score (0–100)
        # Optimal classroom discussion ratio is typically between 25% and 75%
        acoustic_score = min(100.0, max(15.0, (speech_ratio * 70.0) + (min(mean_rms * 1000.0, 30.0))))

        return {
            "filename": original_filename,
            "duration_seconds": round(duration_sec, 2),
            "original_sample_rate": orig_sr,
            "processed_sample_rate": self.target_sample_rate,
            "original_channels": orig_channels,
            "processed_channels": 1,
            "total_segments": len(segments),
            "segment_duration_sec": self.segment_duration_sec,
            "silence_threshold_rms": self.silence_threshold_rms,
            "rms_energy_mean": round(mean_rms, 5),
            "speech_ratio": speech_ratio,
            "silence_ratio": silence_ratio,
            "acoustic_vitality_score": round(acoustic_score, 1),
            "segments": segments,
            "waveform_preview": downsampled_waveform
        }

    def generate_synthetic_audio_bytes(self, duration_sec: float = 4.0) -> bytes:
        """
        Creates a live 4-second WAV buffer containing speech-like sinusoidal bursts and silence
        to demonstrate Activity 3.1 without needing an uploaded file.
        """
        sr = self.target_sample_rate
        total_samples = int(duration_sec * sr)
        t = np.linspace(0, duration_sec, total_samples, endpoint=False)

        # Segment 1 (0-1.5s): Speech burst at 440 Hz + harmonic modulation
        # Segment 2 (1.5-2.5s): Silence / ambient low noise
        # Segment 3 (2.5-4.0s): Active speech response at 520 Hz
        signal = np.zeros(total_samples, dtype=np.float32)

        idx_1 = int(1.5 * sr)
        idx_2 = int(2.5 * sr)

        signal[:idx_1] = (0.35 * np.sin(2 * np.pi * 440 * t[:idx_1]) +
                          0.15 * np.sin(2 * np.pi * 880 * t[:idx_1]))
        signal[idx_1:idx_2] = 0.003 * np.random.normal(0, 1, idx_2 - idx_1)
        signal[idx_2:] = (0.40 * np.sin(2 * np.pi * 520 * t[idx_2:]) +
                          0.10 * np.sin(2 * np.pi * 1040 * t[idx_2:]))

        buffer = io.BytesIO()
        sf.write(buffer, signal, sr, format="WAV", subtype="PCM_16")
        buffer.seek(0)
        return buffer.read()


# Singleton pipeline instance
audio_pipeline = AudioPipeline()
