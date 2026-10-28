export interface Student {
  id: number;
  student_id: string;
  name: string;
  email?: string;
  department: string;
  year_of_study: number;
  is_active: boolean;
  created_at: string;
}

export interface SessionItem {
  id: number;
  session_code: string;
  title: string;
  course_name: string;
  instructor_name: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  start_time?: string;
  end_time?: string;
  duration_seconds: number;
  consent_confirmed: boolean;
  notes?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  source: 'MANUAL' | 'CONSENT_VERIFIED' | 'BATCH_IMPORT';
  notes?: string;
  check_in_time: string;
  created_at: string;
  updated_at: string;
  student_code?: string;
  student_name?: string;
  student_department?: string;
}

export interface AudioSegment {
  start_seconds: number;
  end_seconds: number;
  rms_energy: number;
  speech_activity: boolean;
}

export interface AudioAnalysisResult {
  id?: number;
  session_id?: number;
  filename: string;
  duration_seconds: number;
  original_sample_rate: number;
  processed_sample_rate: number;
  original_channels: number;
  processed_channels: number;
  rms_energy_mean: number;
  speech_ratio: number;
  silence_ratio: number;
  segments: AudioSegment[];
  waveform_downsampled?: number[];
  status: 'COMPLETED' | 'FAILED';
  error_message?: string;
  created_at?: string;
}

export interface VideoFrameSample {
  timestamp_seconds: number;
  face_count: number;
  confidence_mean?: number;
}

export interface VideoAnalysisResult {
  id?: number;
  session_id?: number;
  filename: string;
  duration_seconds: number;
  fps: number;
  width: number;
  height: number;
  sampled_frames_count: number;
  sampling_interval_seconds: number;
  average_face_count: number;
  max_face_count: number;
  min_face_count: number;
  face_counts_timeline: VideoFrameSample[];
  preview_frames?: string[];
  detection_method: string;
  status: 'COMPLETED' | 'FAILED';
  error_message?: string;
  created_at?: string;
}

export interface TimeAlignedPoint {
  timestamp_seconds: number;
  rms_energy?: number;
  speech_active?: boolean;
  face_count?: number;
  visual_active?: boolean;
  point_engagement_score: number;
}

export interface EngagementResult {
  id?: number;
  session_id: number;
  overall_engagement_score: number;
  visual_indicator_score: number;
  audio_indicator_score: number;
  timeline: TimeAlignedPoint[];
  explainability: {
    formula_name?: string;
    weights?: {
      visual_presence_weight?: number;
      acoustic_activity_weight?: number;
    };
    parameters?: Record<string, any>;
    features_used?: string[];
    interpretation_guide?: string;
  };
  warnings: string[];
  formula_version: string;
  created_at?: string;
}

export interface AttendanceTrend {
  session_id: number;
  session_code: string;
  session_title: string;
  date: string;
  total_enrolled: number;
  present_count: number;
  attendance_rate: number;
}

export interface EngagementTrend {
  session_id: number;
  session_code: string;
  session_title: string;
  date: string;
  engagement_score: number;
  visual_score: number;
  audio_score: number;
}

export interface AnalyticsOverview {
  total_sessions: number;
  total_enrolled_students: number;
  average_attendance_rate: number;
  average_engagement_score: number;
  recent_sessions: {
    id: number;
    session_code: string;
    title: string;
    course_name: string;
    status: string;
    date: string;
    duration_seconds: number;
  }[];
  attendance_trends: AttendanceTrend[];
  engagement_trends: EngagementTrend[];
}
