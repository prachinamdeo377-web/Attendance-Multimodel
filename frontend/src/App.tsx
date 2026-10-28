import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LiveSession } from './pages/LiveSession';
import { Attendance } from './pages/Attendance';
import { AudioAnalysis } from './pages/AudioAnalysis';
import { VideoAnalysis } from './pages/VideoAnalysis';
import { EngagementAnalytics } from './pages/EngagementAnalytics';
import { SessionHistory } from './pages/SessionHistory';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { CheckCircle2 } from 'lucide-react';

const PageLayout: React.FC<{
  children: React.ReactNode;
  onSeedDemo: () => void;
  isSeeding: boolean;
}> = ({ children, onSeedDemo, isSeeding }) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return { title: 'Dashboard Overview', subtitle: 'Real-time telemetry and student attendance analytics' };
      case '/live':
        return { title: 'Live Classroom Session', subtitle: 'WebRTC video stream and acoustic loudness monitoring' };
      case '/attendance':
        return { title: 'Attendance Management', subtitle: 'Manual verified student roster and CSV export' };
      case '/audio':
        return { title: 'Audio Signal Analysis (Activity 3.1)', subtitle: 'Librosa 16kHz normalized acoustic energy and speech estimation' };
      case '/video':
        return { title: 'Computer Vision Video Analysis', subtitle: 'OpenCV frame sampling and visible attendee face counts' };
      case '/engagement':
        return { title: 'Multimodal Engagement Synthesis', subtitle: 'Explainable heuristic fusion of acoustic and visual telemetry' };
      case '/history':
        return { title: 'Classroom Session History', subtitle: 'Archived sessions, reports, and downloadable audit packages' };
      case '/settings':
        return { title: 'System Settings & Privacy', subtitle: 'Hardware permissions, local-only safeguards, and backend status' };
      default:
        return { title: 'Multimodal Attendance & Engagement Agent', subtitle: 'Classroom AI Platform' };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      <Sidebar onSeedDemo={onSeedDemo} isSeeding={isSeeding} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotification, setSeedNotification] = useState<string | null>(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedNotification(null);
    try {
      const res = await api.seedDemoData();
      setSeedNotification(
        `Demo data initialized: ${res.students_available} students and ${res.sessions_seeded} sessions created!`
      );
      setTimeout(() => {
        setSeedNotification(null);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <BrowserRouter>
      {/* Toast Notification */}
      {seedNotification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{seedNotification}</span>
        </div>
      )}

      <PageLayout onSeedDemo={handleSeedDemo} isSeeding={isSeeding}>
        <Routes>
          <Route path="/" element={<Dashboard onSeedDemo={handleSeedDemo} isSeeding={isSeeding} />} />
          <Route path="/live" element={<LiveSession />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/audio" element={<AudioAnalysis />} />
          <Route path="/video" element={<VideoAnalysis />} />
          <Route path="/engagement" element={<EngagementAnalytics />} />
          <Route path="/history" element={<SessionHistory />} />
          <Route path="/settings" element={<Settings onSeedDemo={handleSeedDemo} isSeeding={isSeeding} />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}

export default App;
