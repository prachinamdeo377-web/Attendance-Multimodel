import React, { useState } from 'react';
import {
  Upload,
  Video as VideoIcon,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { VideoAnalysisResult } from '../types';

export const VideoAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file (.mp4, .avi, .mov, .mkv, .webm).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.uploadVideo(selectedFile);
      setResult(data);
      if (data.preview_frames && data.preview_frames.length > 0) {
        setActivePreview(data.preview_frames[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Video frame extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Computer Vision Face Density</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Video Frame Extraction & Visible Face Counting
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Samples classroom frames at configurable time steps, executes OpenCV Haar Cascade face
            detection, logs visible person counts over time, and generates annotated preview frames.
          </p>
        </div>
      </div>

      {/* Ethical Governance Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold">Important Computer Vision Disclaimer: </span>
          The number of detected faces represents visible individuals within the camera line of
          sight. Occlusion, seating blind spots, and illumination directly impact face counts.
          This module counts visible attendees anonymously and does NOT identify individuals by name.
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30">
            <input
              type="file"
              accept=".mp4,.avi,.mov,.mkv,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <VideoIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Select classroom video recording'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports MP4, AVI, MOV, WEBM (Sampled at 1.0s intervals)
            </p>
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Analyzing Video Frames...' : 'Process Video Frames'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Duration</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.duration_seconds}s
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Resolution</div>
              <div className="text-lg font-bold text-blue-600 mt-1">
                {result.width}x{result.height}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Video FPS</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.fps} FPS
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Sampled Frames</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {result.sampled_frames_count}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Avg Face Count</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">
                {result.average_face_count}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Peak Visible</div>
              <div className="text-lg font-bold text-indigo-600 mt-1">
                {result.max_face_count} faces
              </div>
            </div>
          </div>

          {/* Face Count Timeline Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Visible Face Count Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Number of frontal faces detected at 1-second sampling intervals
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md">
                {result.detection_method}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.face_counts_timeline}>
                  <defs>
                    <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="timestamp_seconds" stroke="#94a3b8" fontSize={11} unit="s" />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
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
                    type="stepAfter"
                    dataKey="face_count"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#faceGrad)"
                    name="Visible Faces"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Annotated Frame Previews */}
          {result.preview_frames && result.preview_frames.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Annotated Detection Frame Thumbnails</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sampled frames with OpenCV bounding box annotations and detection timestamps
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {result.preview_frames.length} snapshots extracted
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {result.preview_frames.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePreview(src)}
                    className={`rounded-lg overflow-hidden border-2 cursor-pointer transition aspect-video bg-black/10 relative group ${
                      activePreview === src ? 'border-blue-600 shadow-md' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Sampled frame ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Large Active Preview */}
              {activePreview && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    Enlarged Inspection Frame:
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-300 max-w-2xl bg-black">
                    <img
                      src={activePreview}
                      alt="Enlarged annotated frame"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
