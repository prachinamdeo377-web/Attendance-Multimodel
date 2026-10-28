import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Radio,
  Eye,
  Volume2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { SessionItem, EngagementResult } from '../types';

export const EngagementAnalytics: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session_id');

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    urlSessionId ? parseInt(urlSessionId) : null
  );
  const [engagement, setEngagement] = useState<EngagementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const list = await api.getSessions();
        setSessions(list);
        if (list.length > 0 && !selectedSessionId) {
          setSelectedSessionId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSessions();
  }, [selectedSessionId]);

  // Load or compute engagement for selected session
  useEffect(() => {
    const fetchEngagement = async () => {
      if (!selectedSessionId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getSessionEngagement(selectedSessionId);
        setEngagement(data);
      } catch (err: any) {
        setError(err.message || 'Failed to compute engagement analytics');
        setEngagement(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEngagement();
  }, [selectedSessionId]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Session Selector */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Multimodal Engagement Synthesis</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Explainable Classroom Engagement Indicator
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Synthesizes synchronized audio energy features and computer vision face counts into an
            explainable, transparent participation vitality metric.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} - {s.title}
              </option>
            ))}
          </select>

          {selectedSessionId && (
            <a
              href={api.getTimelineCsvUrl(selectedSessionId)}
              download
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Timeline CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Critical Ethical Disclaimer Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 text-xs space-y-2 shadow-md">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Info className="w-4 h-4" />
          <span>Strict Ethical & Methodological Boundaries</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          This system derives an <strong>experimental multimodal proxy indicator</strong> from
          observable visual presence and acoustic speech activity. It does <em>NOT</em> claim to
          measure student psychological attention, emotional states, mental focus, understanding, or
          academic comprehension. Loudness and head positions must never be conflated with cognitive
          learning.
        </p>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Aligning temporal streams and calculating multimodal indices...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {engagement && !loading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quality Warnings */}
          {engagement.warnings && engagement.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Data Quality Warnings</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {engagement.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scores Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Overall Gauge Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Overall Multimodal Index
                </span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-amber-600">
                    {engagement.overall_engagement_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Algorithm:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {engagement.formula_version}
                </span>
              </div>
            </div>

            {/* Visual Indicator Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Visual Presence Index
                  </span>
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-blue-600">
                    {engagement.visual_indicator_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span>Weighted Influence: </span>
                <span className="font-semibold text-slate-800">
                  {engagement.explainability?.weights?.visual_presence_weight
                    ? `${engagement.explainability.weights.visual_presence_weight * 100}%`
                    : '50%'}
                </span>
              </div>
            </div>

            {/* Audio Indicator Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Acoustic Vitality Index
                  </span>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-emerald-600">
                    {engagement.audio_indicator_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span>Weighted Influence: </span>
                <span className="font-semibold text-slate-800">
                  {engagement.explainability?.weights?.acoustic_activity_weight
                    ? `${engagement.explainability.weights.acoustic_activity_weight * 100}%`
                    : '50%'}
                </span>
              </div>
            </div>
          </div>

          {/* Synchronized Multimodal Timeline Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Synchronized Multimodal Telemetry Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Seconds-aligned fusion of face count density, audio energy, and point engagement
                  index
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md">
                1-Second Aligned
              </span>
            </div>

            <div className="h-72 w-full">
              {engagement.timeline && engagement.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={engagement.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timestamp_seconds"
                      stroke="#94a3b8"
                      fontSize={11}
                      unit="s"
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#94a3b8"
                      fontSize={11}
                      domain={[0, 100]}
                      unit="pts"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#94a3b8"
                      fontSize={11}
                      allowDecimals={false}
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
                    <Legend />
                    <Bar
                      yAxisId="right"
                      dataKey="face_count"
                      fill="#93c5fd"
                      radius={[3, 3, 0, 0]}
                      name="Visible Face Count"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="point_engagement_score"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      dot={false}
                      name="Engagement Score (0-100)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No timeline telemetry recorded for this session.
                </div>
              )}
            </div>
          </div>

          {/* Explainability Documentation Box */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Transparent Heuristic Formulation & Signals Used</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Formula Breakdown</div>
                <div className="font-mono text-[11px] p-2 rounded bg-white border border-slate-200 text-blue-800">
                  Score = (0.50 × Visual_Presence) + (0.50 × Acoustic_Vitality)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Visual presence measures normalized face count density against nominal room
                  occupancy. Acoustic vitality measures continuous RMS power and zero-crossing speech
                  intervals.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Active Signals In This Session</div>
                <div className="space-y-1">
                  {engagement.explainability?.features_used?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-[11px] pt-1">
                  {engagement.explainability?.interpretation_guide}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
