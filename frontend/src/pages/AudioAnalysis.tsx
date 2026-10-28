import React, { useState } from 'react';
import {
  Upload,
  Mic,
  Volume2,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';
import { AudioAnalysisResult } from '../types';

export const AudioAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file (.wav, .mp3, .ogg, .flac).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.uploadAudio(selectedFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Audio signal processing failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate in-browser synthetic 4-second WAV audio for instant 1-click test
  const handleGenerateSyntheticWav = async () => {
    setLoading(true);
    setError(null);
    try {
      const sampleRate = 16000;
      const duration = 4; // 4 seconds
      const numSamples = sampleRate * duration;
      const buffer = new Float32Array(numSamples);

      // 0-2s: Tone + harmonic modulation (speech simulation), 2-4s: low ambient noise
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        if (t < 2.0) {
          buffer[i] =
            0.4 * Math.sin(2 * Math.PI * 300 * t) +
            0.2 * Math.sin(2 * Math.PI * 600 * t) +
            (Math.random() - 0.5) * 0.05;
        } else {
          buffer[i] = (Math.random() - 0.5) * 0.005; // silence / ambient
        }
      }

      // Encode simple PCM 16-bit WAV
      const wavBytes = encodeWAV(buffer, sampleRate);
      const syntheticBlob = new Blob([wavBytes], { type: 'audio/wav' });
      const syntheticFile = new File([syntheticBlob], 'synthetic_classroom_speech.wav', {
        type: 'audio/wav',
      });

      setSelectedFile(syntheticFile);
      const data = await api.uploadAudio(syntheticFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate synthetic audio test');
    } finally {
      setLoading(false);
    }
  };

  // Basic WAV encoder helper
  const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  // Prepare chart data from segments
  const segmentChartData =
    result?.segments?.map((seg) => ({
      time: `${seg.start_seconds}s - ${seg.end_seconds}s`,
      start: seg.start_seconds,
      rms: seg.rms_energy,
      speech: seg.speech_activity ? 1 : 0,
      speechLabel: seg.speech_activity ? 'Active Speech' : 'Silence',
    })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Activity 3.1 Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Activity 3.1: Audio Signal Processing</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Acoustic Signal Extraction & Speech Activity Estimator
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Loads recorded audio, downsamples/normalizes to 16 kHz mono, computes 2.0s segment Root
            Mean Square (RMS) energy, and derives acoustic speech/silence intervals.
          </p>
        </div>

        <button
          onClick={handleGenerateSyntheticWav}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Generate 1-Click Synthetic Audio</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30">
            <input
              type="file"
              accept=".wav,.mp3,.ogg,.flac,.m4a,.aac"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileAudio className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to select audio file or drag & drop'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports WAV, MP3, FLAC, OGG (Up to 100 MB)
            </p>
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Processing Librosa Pipeline...' : 'Run Audio Extraction'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Duration</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.duration_seconds}s
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Target Sample Rate</div>
              <div className="text-lg font-bold text-blue-600 mt-1">
                {result.processed_sample_rate} Hz
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Original Sampling</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.original_sample_rate} Hz
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Channels</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.original_channels} ch → {result.processed_channels} mono
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Speech Activity</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">
                {Math.round(result.speech_ratio * 100)}%
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Mean RMS Energy</div>
              <div className="text-lg font-bold text-amber-600 mt-1">
                {result.rms_energy_mean}
              </div>
            </div>
          </div>

          {/* Waveform Envelope Visualization */}
          {result.waveform_downsampled && result.waveform_downsampled.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Continuous Numerical Waveform (Downsampled Envelope)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  {result.waveform_downsampled.length} sampled points
                </span>
              </div>

              {/* Waveform Bars */}
              <div className="h-20 flex items-center gap-0.5 pt-2">
                {result.waveform_downsampled.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 hover:bg-blue-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(8, val * 100)}%`,
                      opacity: Math.max(0.3, val),
                    }}
                    title={`Amplitude: ${val}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* RMS Energy Chart Over Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Segment RMS Energy (Root Mean Square)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Physical acoustic amplitude measured across 2.0s windows
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md">
                  Energy Metric
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={segmentChartData}>
                    <defs>
                      <linearGradient id="rmsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="start" stroke="#94a3b8" fontSize={10} unit="s" />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rms"
                      stroke="#d97706"
                      strokeWidth={2}
                      fill="url(#rmsGrad)"
                      name="RMS Energy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Speech Activity Timeline */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Estimated Speech Activity Timeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Heuristic zero-crossing + energy classification
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-md">
                  Speech Heuristic
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="start" stroke="#94a3b8" fontSize={10} unit="s" />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      domain={[0, 1]}
                      ticks={[0, 1]}
                      tickFormatter={(v) => (v === 1 ? 'Speech' : 'Quiet')}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="speech" fill="#10b981" radius={[4, 4, 0, 0]} name="Speech Detected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Segment Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Segment-Level Numerical Data (Activity 3.1 Schema)
              </h3>
              <span className="text-xs text-slate-500">
                Total Segments: {result.segments.length}
              </span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Segment #</th>
                    <th className="py-2.5 px-4">Time Interval</th>
                    <th className="py-2.5 px-4">RMS Energy</th>
                    <th className="py-2.5 px-4">Speech Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {result.segments.map((seg, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-4 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-2 px-4 font-mono text-slate-700">
                        {seg.start_seconds.toFixed(1)}s — {seg.end_seconds.toFixed(1)}s
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-amber-700">
                        {seg.rms_energy.toFixed(4)}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            seg.speech_activity
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {seg.speech_activity ? 'SPEECH ACTIVE' : 'SILENCE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
