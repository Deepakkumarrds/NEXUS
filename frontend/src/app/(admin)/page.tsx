'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user?.role === 'Admin');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/dashboard/stats?role=${encodeURIComponent(user?.role || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-rose-500">Failed to load dashboard statistics.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Active Clients</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalClients}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Currently managed</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Tasks Pending</p>
          <p className="text-3xl font-bold text-slate-900">{stats.pendingTasks}</p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Requires action
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.openEscalations > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Open Escalations</p>
          <p className="text-3xl font-bold text-slate-900">{stats.openEscalations}</p>
          <p className={`text-xs mt-2 font-medium flex items-center ${stats.openEscalations > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {stats.openEscalations > 0 ? 'Urgent attention needed' : 'All clear'}
          </p>
        </div>
        
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total SOW Value</p>
            <p className="text-3xl font-bold text-slate-900">₹{stats.totalSowValue ? stats.totalSowValue.toLocaleString('en-IN') : '0'}</p>
            <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Active contracts
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-lg font-bold text-slate-900">Recent Tasks</h2>
          <Link href="/tasks" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">View All</Link>
        </div>
        <ul className="space-y-4 relative z-10">
          {stats.recentTasks && stats.recentTasks.length > 0 ? (
            stats.recentTasks.map((task: any) => (
              <li key={task.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                <div className="flex flex-col">
                  <Link href={`/tasks/${task.id}`} className="text-slate-800 font-semibold hover:text-indigo-600 transition-colors">
                    {task.title}
                  </Link>
                  <span className="text-slate-500 text-xs mt-1 font-medium">{task.client?.company_name || 'Internal'}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${task.status === 'Completed' || task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {task.status}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">No tasks available.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
