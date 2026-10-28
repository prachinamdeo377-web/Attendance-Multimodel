import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  ShieldAlert,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { SessionItem, AttendanceRecord, Student } from '../types';

export const Attendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session_id');

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    urlSessionId ? parseInt(urlSessionId) : null
  );
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // New Student Modal state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStuId, setNewStuId] = useState('');
  const [newStuName, setNewStuName] = useState('');
  const [newStuEmail, setNewStuEmail] = useState('');
  const [newStuDept, setNewStuDept] = useState('AI & Data Science');
  const [studentError, setStudentError] = useState<string | null>(null);

  // Load Sessions and Students
  useEffect(() => {
    const init = async () => {
      try {
        const [sessList, stuList] = await Promise.all([api.getSessions(), api.getStudents()]);
        setSessions(sessList);
        setAllStudents(stuList);
        if (sessList.length > 0 && !selectedSessionId) {
          setSelectedSessionId(sessList[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, [selectedSessionId]);

  // Load attendance when session changes
  const fetchAttendance = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const records = await api.getSessionAttendance(selectedSessionId);
      setAttendanceList(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedSessionId]);

  // Change single student status
  const handleStatusChange = async (studentId: number, newStatus: string) => {
    if (!selectedSessionId) return;
    try {
      await api.recordAttendance(selectedSessionId, {
        student_id: studentId,
        status: newStatus,
        source: 'MANUAL',
        notes: `Updated via instructor attendance register at ${new Date().toLocaleTimeString()}`,
      });
      fetchAttendance();
    } catch (e: any) {
      alert(e.message || 'Failed to update attendance');
    }
  };

  // Mark all enrolled students present
  const handleMarkAllPresent = async () => {
    if (!selectedSessionId || allStudents.length === 0) return;
    if (!confirm('Mark all enrolled students as PRESENT for this session?')) return;
    try {
      const bulkPayload = allStudents.map((s) => ({
        student_id: s.id,
        status: 'PRESENT',
        source: 'MANUAL',
        notes: 'Batch marked present',
      }));
      await api.bulkRecordAttendance(selectedSessionId, bulkPayload);
      fetchAttendance();
    } catch (e: any) {
      alert(e.message || 'Failed to bulk mark attendance');
    }
  };

  // Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuId.trim() || !newStuName.trim()) {
      setStudentError('Student ID and Full Name are required.');
      return;
    }
    setStudentError(null);
    try {
      const created = await api.createStudent({
        student_id: newStuId.trim(),
        name: newStuName.trim(),
        email: newStuEmail.trim() || undefined,
        department: newStuDept.trim(),
        year_of_study: 3,
      });
      setAllStudents((prev) => [...prev, created]);
      // Also mark them present in current session
      if (selectedSessionId) {
        await api.recordAttendance(selectedSessionId, {
          student_id: created.id,
          status: 'PRESENT',
          source: 'MANUAL',
        });
        fetchAttendance();
      }
      setShowAddStudent(false);
      setNewStuId('');
      setNewStuName('');
      setNewStuEmail('');
    } catch (err: any) {
      setStudentError(err.message || 'Failed to create student');
    }
  };

  // Merge enrolled students with recorded attendance
  const displayRows = allStudents.map((stu) => {
    const existing = attendanceList.find((a) => a.student_id === stu.id);
    return {
      student_id_num: stu.id,
      student_code: stu.student_id,
      student_name: stu.name,
      department: stu.department,
      status: existing ? existing.status : 'ABSENT',
      check_in_time: existing?.check_in_time || 'Not checked in',
      source: existing?.source || 'MANUAL',
      notes: existing?.notes || '',
    };
  });

  const filteredRows = displayRows.filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const presentCount = displayRows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendancePercentage = displayRows.length > 0 ? Math.round((presentCount / displayRows.length) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <span className="font-bold">Authorized Attendance Governance: </span>
          Attendance is recorded through authorized instructor manual workflows and consent-verified
          roster check-ins. Facial detection counts are used purely as anonymous visual telemetry and
          are NOT automatically assigned to student records without consent.
        </div>
      </div>

      {/* Control Bar: Session Selector, Stats & Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attendance Register
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code} - {s.title}
                </option>
              ))}
            </select>
            <button
              onClick={fetchAttendance}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition"
              title="Refresh attendance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Stats Pill */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-3">
            <span>
              Enrolled: <strong>{displayRows.length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700">
              Present: <strong>{presentCount}</strong> ({attendancePercentage}%)
            </span>
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={() => setShowAddStudent(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>

          {selectedSessionId && (
            <a
              href={api.getAttendanceCsvUrl(selectedSessionId)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student ID, name, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Student ID</th>
                <th className="py-3 px-5">Full Name</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Attendance Status</th>
                <th className="py-3 px-5">Check-in Timestamp</th>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-5 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.student_id_num} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{row.student_code}</td>
                    <td className="py-3 px-5 font-semibold text-slate-900">{row.student_name}</td>
                    <td className="py-3 px-5 text-slate-500">{row.department}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : row.status === 'EXCUSED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.status === 'PRESENT' && <CheckCircle className="w-3 h-3" />}
                        {row.status === 'LATE' && <Clock className="w-3 h-3" />}
                        {row.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        <span>{row.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-500 text-[11px] whitespace-nowrap">
                      {row.check_in_time !== 'Not checked in'
                        ? new Date(row.check_in_time).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-3 px-5 text-slate-500 text-[10px] uppercase font-semibold">
                      {row.source}
                    </td>
                    <td className="py-3 px-5 text-right space-x-1">
                      <button
                        onClick={() => handleStatusChange(row.student_id_num, 'PRESENT')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          row.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-emerald-100 text-slate-600'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.student_id_num, 'LATE')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          row.status === 'LATE'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-600'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.student_id_num, 'ABSENT')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          row.status === 'ABSENT'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 hover:bg-rose-100 text-slate-600'
                        }`}
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Enroll New Student</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new student to the official classroom roster</p>

            {studentError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {studentError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Roll / ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIML-2024-042"
                  value={newStuId}
                  onChange={(e) => setNewStuId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newStuName}
                  onChange={(e) => setNewStuName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. priya.s@univ.edu"
                  value={newStuEmail}
                  onChange={(e) => setNewStuEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newStuDept}
                  onChange={(e) => setNewStuDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
