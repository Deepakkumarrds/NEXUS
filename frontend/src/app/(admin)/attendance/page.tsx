'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const STATUS_COLORS = {
  Offline: 'bg-slate-400',
  Available: 'bg-emerald-500',
  'Tea Break': 'bg-yellow-500',
  'Lunch Break': 'bg-amber-500',
  Meeting: 'bg-rose-500',
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchMyStatus();
    fetchHistory();

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
        const socket = io(apiUrl);
        
        socket.emit('join_user_room', user.id);
        
        socket.on('attendance_update', () => {
          fetchMyStatus();
          fetchHistory();
        });

        return () => {
          socket.disconnect();
        };
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (mins: number) => {
    if (!mins || mins === 0) return '-';
    const hrs = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (hrs > 0) return `${hrs}h ${m}m`;
    return `${m}m`;
  };

  const calculateDurations = (logs: any[]) => {
    let work = 0;
    let tea = 0;
    let lunch = 0;
    logs.forEach(log => {
      const m = log.duration_minutes || 0;
      if (log.status === 'Available' || log.status === 'Meeting') work += m;
      if (log.status === 'Tea Break') tea += m;
      if (log.status === 'Lunch Break') lunch += m;
    });
    return { work, tea, lunch };
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      const res = await fetch(`${apiUrl}/api/attendance/history`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const fetchMyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      const res = await fetch(`${apiUrl}/api/attendance/my-status`, {
        cache: 'no-store',
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

      <div className="mb-6 flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'today'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          History
        </button>
      </div>

      {activeTab === 'today' && (
        !attendance ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">You haven't punched in today.</h3>
            <p className="text-sm text-slate-500 mt-1">Use the tracker dropdown in the sidebar to start your day.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1.5">Login Time</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Date(attendance.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1.5">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[attendance.status_logs[0]?.status as keyof typeof STATUS_COLORS] || 'bg-slate-400'}`}></span>
                  <p className="text-2xl font-bold text-slate-900">
                    {attendance.logout_time ? 'Logged Out' : attendance.status_logs[0]?.status || 'Available'}
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1.5">Logout Time</p>
                <p className="text-2xl font-bold text-slate-900">
                  {attendance.logout_time ? new Date(attendance.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Today's Activity Timeline</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {attendance.status_logs.map((log: any) => (
                  <li key={log.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${STATUS_COLORS[log.status as keyof typeof STATUS_COLORS]}`}></span>
                        <div>
                          <p className="text-[15px] font-semibold text-slate-900 leading-none mb-1.5">{log.status}</p>
                          <p className="text-[13px] text-slate-500">
                            Started at {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {log.end_time && ` • Ended at ${new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                          {Math.round(log.duration_minutes || (log.end_time ? 0 : (currentTime.getTime() - new Date(log.start_time).getTime()) / 60000))} mins
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Login / Logout</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hours Worked</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tea Break</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lunch Break</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No past attendance records found.</td>
                  </tr>
                ) : (
                  history.map((record: any) => {
                    const durations = calculateDurations(record.status_logs || []);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className="text-emerald-600 font-semibold">{new Date(record.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {' - '}
                          <span className="text-slate-600">{record.logout_time ? new Date(record.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missed Logout'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">
                          {formatDuration(durations.work)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                          {formatDuration(durations.tea)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">
                          {formatDuration(durations.lunch)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
