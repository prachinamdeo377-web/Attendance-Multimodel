import React, { useState } from 'react';
import { Plus, Radio, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onSessionCreated?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, onSessionCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [courseName, setCourseName] = useState('Deep Learning & Vision (AI301)');
  const [instructor, setInstructor] = useState('Prof. A. Sharma');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) {
      setError('Please provide a session title.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await api.createSession({
        title: sessionTitle.trim(),
        course_name: courseName.trim(),
        instructor_name: instructor.trim(),
        consent_confirmed: true,
      });
      setShowModal(false);
      setSessionTitle('');
      if (onSessionCreated) onSessionCreated();
      // Navigate directly to live session
      navigate(`/live?session_id=${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Agent Ready (Local Mode)</span>
        </div>

        {/* Start Session Button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Classroom Session</span>
        </button>
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Initialize Classroom Session</h3>
                <p className="text-xs text-slate-500">Configure attendance and audio-visual telemetry</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 4: Audio Waveform Analysis"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Instructor
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Classroom Authorization & Privacy</span>
                </div>
                <p>
                  Video face counts and audio energy will be processed locally. No biometric
                  identities are assigned automatically without separate consent.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Launch Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
