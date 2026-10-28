import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarCheck2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Radio,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

interface DashboardProps {
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSeedDemo, isSeeding }) => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await api.getAnalyticsOverview();
      setData(overview);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Aggregating multimodal telemetry...</p>
        </div>
      </div>
    );
  }

  const hasData = (data?.total_sessions || 0) > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Radio className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span>Multimodal Classroom AI Agent</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Classroom Attendance & Engagement Overview
          </h2>
          <p className="text-xs text-blue-200 max-w-xl">
            Real-time acoustic energy extraction, OpenCV computer vision face detection, and
            transparent, explainable engagement heuristic analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-xs transition cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!hasData && (
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-900 font-bold rounded-xl text-xs shadow-md hover:bg-blue-50 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isSeeding ? 'Initializing Demo...' : 'Load Demo Classroom Data'}</span>
            </button>
          )}
          <Link
            to="/live"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Radio className="w-4 h-4" />
            <span>Launch Live Stream</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sessions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sessions
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data?.total_sessions || 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              Recorded
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Classroom sessions tracked</p>
        </div>

        {/* Card 2: Enrolled Students */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data?.total_enrolled_students || 0}
            </span>
            <span className="text-xs text-indigo-600 font-semibold">Active Roster</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized enrollment registry</p>
        </div>

        {/* Card 3: Attendance Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avg Attendance Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data?.average_attendance_rate || 0}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Manual / consent verification</p>
        </div>

        {/* Card 4: Engagement Indicator */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Engagement Indicator
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data?.average_engagement_score || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Experimental multimodal proxy</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Rate Trend</h3>
              <p className="text-xs text-slate-500">Historical verified student participation %</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
              Verified Register
            </span>
          </div>

          <div className="h-64 w-full">
            {data?.attendance_trends && data.attendance_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.attendance_trends}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} unit="%" />
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
                    dataKey="attendance_rate"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#attGrad)"
                    name="Attendance %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No attendance trend data available. Start or seed a session to view trends.
              </div>
            )}
          </div>
        </div>

        {/* Engagement Trend Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multimodal Engagement Index</h3>
              <p className="text-xs text-slate-500">Acoustic vitality + visible attendee presence</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md font-medium">
              Heuristic Proxy
            </span>
          </div>

          <div className="h-64 w-full">
            {data?.engagement_trends && data.engagement_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagement_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement_score"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#d97706' }}
                    name="Overall Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="visual_score"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Visual Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="audio_score"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Audio Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No engagement index data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Classroom Sessions</h3>
            <p className="text-xs text-slate-500">Latest active and archived telemetry records</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Sessions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recent_sessions && data.recent_sessions.length > 0 ? (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Session Code</th>
                  <th className="py-3 px-5">Session Title & Course</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recent_sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5 font-mono font-medium text-blue-700">
                      {sess.session_code}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{sess.title}</div>
                      <div className="text-[11px] text-slate-400">{sess.course_name}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{sess.date}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sess.status === 'LIVE'
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : sess.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <Link
                        to={`/attendance?session_id=${sess.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Attendance
                      </Link>
                      <Link
                        to={`/engagement?session_id=${sess.id}`}
                        className="text-xs font-semibold text-amber-600 hover:underline"
                      >
                        Analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <div className="text-slate-800 font-semibold text-sm">No Classroom Sessions Recorded Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Initialize a live session or seed sample demonstration data to explore all multimodal
              dashboards and analytics.
            </p>
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Seeding...' : 'Load Sample College Project Data'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
