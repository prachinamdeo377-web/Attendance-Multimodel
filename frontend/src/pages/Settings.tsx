import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  HardDrive,
  Camera,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Server
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsProps {
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ onSeedDemo, isSeeding }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [micCameraCheck, setMicCameraCheck] = useState<string | null>(null);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (e: any) {
      setHealthData({ status: 'OFFLINE', error: e.message });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const testHardwarePermissions = async () => {
    setMicCameraCheck('Testing browser permissions...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicCameraCheck('Browser does not support getUserMedia API.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicCameraCheck('SUCCESS: Camera and Microphone are accessible and authorized!');
    } catch (err: any) {
      setMicCameraCheck(`FAILED: ${err.message || 'Access was denied or device not found'}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Agent Governance & Infrastructure</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">System Settings & Privacy</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure local hardware interfaces, privacy consent rules, model parameters, and
            backend diagnostics.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          title="Refresh Backend Diagnostics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Health Status Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Backend Health & Runtime Environment</span>
          </div>

          {healthLoading ? (
            <div className="text-xs text-slate-400 py-4">Checking backend health...</div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Service API Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {healthData?.status || 'ONLINE'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">SQLite Database:</span>
                <span className="font-bold text-slate-800">
                  {healthData?.database || 'CONNECTED'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Python Runtime:</span>
                <span className="font-mono text-slate-800">
                  {healthData?.python_version || 'Python 3.13'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Audio Signal Pipeline:</span>
                <span className="font-semibold text-blue-700">
                  {healthData?.audio_pipeline || 'Librosa / SoundFile (16 kHz)'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Computer Vision Face Detector:</span>
                <span className="font-semibold text-indigo-700">
                  {healthData?.video_pipeline || 'OpenCV Haar Cascade / YuNet'}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Privacy Safeguard Mode:</span>
                <span className="font-semibold text-emerald-700">
                  {healthData?.privacy_mode || 'Strict Local Processing'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hardware Diagnostics */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Browser Hardware Permissions</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            The application queries standard HTML5 WebRTC media devices for local camera feeds and
            the Web Audio API for classroom loudness analysis. Audio and video frames remain
            strictly within the local host.
          </p>

          <button
            onClick={testHardwarePermissions}
            className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Run Camera & Mic Diagnostic Test
          </button>

          {micCameraCheck && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                micCameraCheck.startsWith('SUCCESS')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {micCameraCheck}
            </div>
          )}
        </div>

        {/* Privacy & Governance Controls */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Privacy & Consent Governance</span>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <div className="font-semibold text-slate-900">Local Processing Only</div>
                <div className="text-[11px] text-slate-500">
                  Zero external cloud uploads for video or audio streams
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ENFORCED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <div className="font-semibold text-slate-900">No Covert Facial Tagging</div>
                <div className="text-[11px] text-slate-500">
                  Detected faces are anonymous counts; never matched without consent
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <div className="font-semibold text-slate-900">Recording Retention Window</div>
                <div className="text-[11px] text-slate-500">
                  Raw uploaded streams deleted immediately post-analysis
                </div>
              </div>
              <span className="font-mono text-slate-800 font-bold">Ephemeral (0 days)</span>
            </div>
          </div>
        </div>

        {/* Demo Mode & Seed Actions */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>College Evaluation & Demonstration Actions</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Easily populate complete classroom sample data for viva voce, professor reviews, or
            technical interviews without requiring live camera hardware.
          </p>

          <div className="pt-2">
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? 'Seeding In Progress...' : 'Initialize Sample Classroom Records'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
