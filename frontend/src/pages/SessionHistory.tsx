import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Calendar,
  Clock,
  FileText,
  Radio,
  Eye,
  Volume2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { SessionItem } from '../types';

export const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const list = await api.getSessions();
        setSessions(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Classroom Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Classroom Session History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse archived sessions, review verified attendance, audit multimodal engagement, and
            download audit packages.
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg">
          {sessions.length} Recorded Sessions
        </span>
      </div>

      {/* Session Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading session archive...
          </div>
        ) : sessions.length > 0 ? (
          sessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Meta */}
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                    {sess.session_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sess.status === 'LIVE'
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : sess.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sess.status}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sess.created_at).toLocaleDateString()}
                  </span>
                  {sess.duration_seconds > 0 && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(sess.duration_seconds / 60)} mins
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-tight">{sess.title}</h3>
                <p className="text-xs text-slate-500">
                  Course: <span className="font-medium text-slate-700">{sess.course_name}</span> • Instructor:{' '}
                  <span className="font-medium text-slate-700">{sess.instructor_name}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/attendance?session_id=${sess.id}`}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
                >
                  Attendance Roster
                </Link>

                <Link
                  to={`/engagement?session_id=${sess.id}`}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 transition"
                >
                  Engagement Index
                </Link>

                <a
                  href={api.getReportMarkdownUrl(sess.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Report (MD)</span>
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200">
            No session archives found. Click "Initialize Demo Data" in the sidebar to populate sample
            sessions.
          </div>
        )}
      </div>
    </div>
  );
};
