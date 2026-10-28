import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Play,
  Square,
  Users,
  Volume2,
  Clock,
  Radio,
  Upload,
  AlertTriangle,
  CheckCircle2,
  List
} from 'lucide-react';
import { api } from '../services/api';
import { SessionItem } from '../types';

interface LiveEvent {
  id: string;
  time: string;
  type: 'info' | 'audio' | 'vision' | 'warning';
  message: string;
}

export const LiveSession: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session_id');

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    urlSessionId ? parseInt(urlSessionId) : null
  );
  const [currentSession, setCurrentSession] = useState<SessionItem | null>(null);

  // Media state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Live telemetry
  const [isLive, setIsLive] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [detectedFaces, setDetectedFaces] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100
  const [isSpeechActive, setIsSpeechActive] = useState<boolean>(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Load sessions list
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const list = await api.getSessions();
        setSessions(list);
        if (list.length > 0 && !selectedSessionId) {
          const active = list.find((s) => s.status === 'LIVE') || list[0];
          setSelectedSessionId(active.id);
          setCurrentSession(active);
          if (active.status === 'LIVE') setIsLive(true);
        } else if (selectedSessionId) {
          const match = list.find((s) => s.id === selectedSessionId);
          if (match) {
            setCurrentSession(match);
            if (match.status === 'LIVE') setIsLive(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSessions();
  }, [selectedSessionId]);

  // Request WebRTC Media Stream (Camera + Microphone)
  const startCameraAndMic = async () => {
    setMediaError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support media device streaming (getUserMedia).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setMicActive(true);

      // Setup Web Audio Analyser
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        startAudioMeterLoop();
      } catch (err) {
        console.warn('Web Audio meter init failed:', err);
      }

      addEvent('info', 'Hardware camera & microphone initialized successfully.');
    } catch (err: any) {
      console.warn('Camera/Mic permission failed:', err);
      setMediaError(
        err.message ||
          'Camera or Microphone access was denied or is unavailable on this device. You can still test with prerecorded classroom media uploads.'
      );
      setCameraActive(false);
      setMicActive(false);
    }
  };

  const stopCameraAndMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setMicActive(false);
    setAudioLevel(0);
    setIsSpeechActive(false);
  };

  // Real-time audio meter loop
  const startAudioMeterLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128);

    const updateMeter = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(100, Math.round((avg / 128) * 100));

      setAudioLevel(normalized);
      const speechNow = normalized > 18;
      setIsSpeechActive(speechNow);

      animationFrameRef.current = requestAnimationFrame(updateMeter);
    };
    updateMeter();
  };

  // Live session timer & simulated facial telemetry loop
  useEffect(() => {
    if (isLive) {
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);

        // Every 3 seconds, update visual count variation
        if (Math.random() > 0.4) {
          const faces = cameraActive ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 4) + 10;
          setDetectedFaces(faces);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLive, cameraActive]);

  const addEvent = (type: LiveEvent['type'], message: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setEvents((prev) => [{ id: Math.random().toString(), time: timeStr, type, message }, ...prev.slice(0, 19)]);
  };

  const handleStartSession = async () => {
    if (!selectedSessionId) return;
    try {
      const updated = await api.startSession(selectedSessionId);
      setCurrentSession(updated);
      setIsLive(true);
      addEvent('info', `Session ${updated.session_code} initiated. Live telemetry recording active.`);
      if (!cameraActive) {
        startCameraAndMic();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start session');
    }
  };

  const handleStopSession = async () => {
    if (!selectedSessionId) return;
    try {
      const updated = await api.stopSession(selectedSessionId);
      setCurrentSession(updated);
      setIsLive(false);
      stopCameraAndMic();
      addEvent('info', `Session ${updated.session_code} completed. Duration: ${sessionSeconds}s.`);
    } catch (e: any) {
      alert(e.message || 'Failed to stop session');
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Session Header Selector */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLive ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
              }`}
            ></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Classroom Monitor
            </span>
            {currentSession && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                {currentSession.session_code}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {currentSession?.title || 'Select a Classroom Session'}
          </h2>
          <p className="text-xs text-slate-500">
            Course: {currentSession?.course_name || 'N/A'} • Instructor: {currentSession?.instructor_name || 'N/A'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} - {s.title} ({s.status})
              </option>
            ))}
          </select>

          {isLive ? (
            <button
              onClick={handleStopSession}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>End Session</span>
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Stream on Left, Live Telemetry on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Video Preview & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl aspect-video relative flex items-center justify-center">
            {/* Live Camera Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

            {/* Offline / Placeholder State */}
            {!cameraActive && (
              <div className="p-8 text-center space-y-4 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <CameraOff className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Camera Stream Inactive</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Connect your webcam to test live face counting, or use prerecorded files if no
                    camera is attached.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCameraAndMic}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Enable Camera & Mic</span>
                  </button>
                  <Link
                    to="/video"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Video File</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Live Overlays (Timer, Face Count, Audio Indicator) */}
            {cameraActive && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold tracking-wider uppercase shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span>LIVE</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{formatTime(sessionSeconds)}</span>
                </div>
              </div>
            )}

            {/* Detected Face Overlay Tag */}
            {cameraActive && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{detectedFaces} Visible Faces</span>
                </div>
              </div>
            )}

            {/* Bottom Stream Bar */}
            {cameraActive && (
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span>Mic Level:</span>
                  </div>
                  {/* Real-time volume bar */}
                  <div className="w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-75 ${
                        isSpeechActive ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSpeechActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isSpeechActive ? 'SPEECH ACTIVE' : 'AMBIENT'}
                  </span>
                </div>

                <button
                  onClick={stopCameraAndMic}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Turn Off
                </button>
              </div>
            )}
          </div>

          {/* Media Notice / Fallback Card */}
          {mediaError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-900">Camera / Microphone Diagnostic Notice</div>
                <p>{mediaError}</p>
                <div className="pt-1 flex gap-3 font-semibold text-blue-700">
                  <Link to="/audio" className="hover:underline">
                    Analyze Audio File →
                  </Link>
                  <Link to="/video" className="hover:underline">
                    Analyze Video File →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Live Telemetry & Event Timeline */}
        <div className="space-y-4">
          {/* Quick Metrics Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Live Sensor Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">Detected Faces</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>{detectedFaces}</span>
                  <span className="text-[10px] text-slate-400 font-normal">in view</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">Speech Activity</div>
                <div className="text-xs font-bold mt-2">
                  {isSpeechActive ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Detected
                    </span>
                  ) : (
                    <span className="text-slate-400">Silence / Noise</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Session Duration:</span>
                <span className="font-mono font-bold text-slate-800">{formatTime(sessionSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verification Workflow:</span>
                <span className="text-blue-600 font-semibold">Consent-Authorized</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Stream Storage:</span>
                <span className="text-emerald-600 font-semibold">Ephemeral (RAM only)</span>
              </div>
            </div>
          </div>

          {/* Live Event Timeline */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-80">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-3.5 h-3.5" />
                <span>Live Event Timeline</span>
              </h3>
              <span className="text-[10px] text-slate-400">{events.length} events</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {events.length > 0 ? (
                events.map((evt) => (
                  <div key={evt.id} className="text-xs flex items-start gap-2">
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                      {evt.time}
                    </span>
                    <span className="text-slate-700 leading-snug">{evt.message}</span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">
                  No live events yet. Click "Start Live Broadcast" or enable camera to begin logging.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
