import {
  Student,
  SessionItem,
  AttendanceRecord,
  AudioAnalysisResult,
  VideoAnalysisResult,
  EngagementResult,
  AnalyticsOverview
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  // Analytics Overview
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to load analytics overview');
    return res.json();
  },

  // Students
  async getStudents(search?: string, department?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch student directory');
    return res.json();
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create student record');
    }
    return res.json();
  },

  async deleteStudent(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  // Sessions
  async getSessions(status?: string): Promise<SessionItem[]> {
    const url = status ? `${API_BASE}/sessions?status=${status}` : `${API_BASE}/sessions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load classroom sessions');
    return res.json();
  },

  async getSession(id: number): Promise<SessionItem> {
    const res = await fetch(`${API_BASE}/sessions/${id}`);
    if (!res.ok) throw new Error('Failed to load session details');
    return res.json();
  },

  async createSession(data: Partial<SessionItem>): Promise<SessionItem> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initialize session');
    }
    return res.json();
  },

  async startSession(id: number): Promise<SessionItem> {
    const res = await fetch(`${API_BASE}/sessions/${id}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start live session');
    return res.json();
  },

  async stopSession(id: number): Promise<SessionItem> {
    const res = await fetch(`${API_BASE}/sessions/${id}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to terminate live session');
    return res.json();
  },

  // Attendance
  async getSessionAttendance(sessionId: number): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/attendance`);
    if (!res.ok) throw new Error('Failed to fetch session attendance');
    return res.json();
  },

  async recordAttendance(
    sessionId: number,
    data: { student_id: number; status: string; source?: string; notes?: string }
  ): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to record attendance');
    }
    return res.json();
  },

  async bulkRecordAttendance(
    sessionId: number,
    records: { student_id: number; status: string; source?: string; notes?: string }[]
  ): Promise<{ message: string; created: number; updated: number }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/attendance/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, records }),
    });
    if (!res.ok) throw new Error('Failed to bulk record attendance');
    return res.json();
  },

  getAttendanceCsvUrl(sessionId: number): string {
    return `${API_BASE}/sessions/${sessionId}/attendance/export`;
  },

  // Audio Analysis (Activity 3.1)
  async uploadAudio(file: File, sessionId?: number): Promise<AudioAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('session_id', sessionId.toString());
    }

    const res = await fetch(`${API_BASE}/audio/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Audio analysis failed');
    }
    return res.json();
  },

  async getAudioAnalysis(id: number): Promise<AudioAnalysisResult> {
    const res = await fetch(`${API_BASE}/audio/${id}`);
    if (!res.ok) throw new Error('Failed to load audio analysis');
    return res.json();
  },

  // Video Analysis
  async uploadVideo(file: File, sessionId?: number): Promise<VideoAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('session_id', sessionId.toString());
    }

    const res = await fetch(`${API_BASE}/video/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Video analysis failed');
    }
    return res.json();
  },

  async getVideoAnalysis(id: number): Promise<VideoAnalysisResult> {
    const res = await fetch(`${API_BASE}/video/${id}`);
    if (!res.ok) throw new Error('Failed to load video analysis');
    return res.json();
  },

  // Engagement & Reports
  async getSessionEngagement(sessionId: number): Promise<EngagementResult> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/engagement`);
    if (!res.ok) throw new Error('Failed to compute or load multimodal engagement');
    return res.json();
  },

  async getSessionReport(sessionId: number) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/report?format=json`);
    if (!res.ok) throw new Error('Failed to load session report data');
    return res.json();
  },

  getReportMarkdownUrl(sessionId: number): string {
    return `${API_BASE}/sessions/${sessionId}/report?format=markdown`;
  },

  getTimelineCsvUrl(sessionId: number): string {
    return `${API_BASE}/sessions/${sessionId}/timeline/export`;
  },

  // Demo Seed
  async seedDemoData(): Promise<{ message: string; students_available: number; sessions_seeded: number }> {
    const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  }
};
