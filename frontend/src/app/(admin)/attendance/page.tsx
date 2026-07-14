'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
  Offline: 'bg-slate-400',
  Available: 'bg-emerald-500',
  'Tea Break': 'bg-yellow-500',
  'Lunch Break': 'bg-amber-500',
  Meeting: 'bg-rose-500',
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyStatus();
  }, []);

  const fetchMyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      const res = await fetch(`${apiUrl}/api/attendance/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.attendance) {
        setAttendance(data.attendance);
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading Attendance Data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Attendance & Status</h1>
        <p className="text-sm text-slate-500 mt-1">Track your daily working hours and breaks.</p>
      </div>

      {!attendance ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">You haven't punched in today.</h3>
          <p className="text-sm text-slate-500 mt-1">Use the tracker dropdown in the sidebar to start your day.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Login Time</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Date(attendance.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[attendance.status_logs[0]?.status as keyof typeof STATUS_COLORS] || 'bg-slate-400'}`}></span>
                <p className="text-xl font-bold text-slate-900">
                  {attendance.logout_time ? 'Logged Out' : attendance.status_logs[0]?.status || 'Available'}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Logout Time</p>
              <p className="text-2xl font-bold text-slate-900">
                {attendance.logout_time ? new Date(attendance.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Today's Activity Timeline</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {attendance.status_logs.map((log: any) => (
                <li key={log.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[log.status as keyof typeof STATUS_COLORS]}`}></span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{log.status}</p>
                        <p className="text-xs text-slate-500">
                          Started at {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {log.end_time && ` • Ended at ${new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    {log.duration_minutes > 0 && (
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {Math.round(log.duration_minutes)} mins
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
