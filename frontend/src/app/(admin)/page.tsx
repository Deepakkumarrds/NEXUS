'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/dashboard/stats`)
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of client health, pending tasks, and recent activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Active Clients</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalClients}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Currently managed</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Tasks Pending</p>
          <p className="text-3xl font-bold text-slate-900">{stats.pendingTasks}</p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Requires action
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Open Escalations</p>
          <p className="text-3xl font-bold text-slate-900">{stats.openEscalations}</p>
          <p className={`text-xs mt-2 font-medium flex items-center ${stats.openEscalations > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {stats.openEscalations > 0 ? 'Urgent attention needed' : 'All clear'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total SOW Value</p>
          <p className="text-3xl font-bold text-slate-900">₹{stats.totalSowValue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            Active contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Tasks</h2>
            <Link href="/tasks" className="text-indigo-600 text-xs font-medium hover:text-indigo-800">View All</Link>
          </div>
          <ul className="space-y-4">
            {stats.recentTasks && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task: any) => (
                <li key={task.id} className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <Link href={`/tasks/${task.id}`} className="text-slate-800 font-medium hover:text-indigo-600 transition-colors">
                      {task.title}
                    </Link>
                    <span className="text-slate-400 text-xs mt-0.5">{task.client?.company_name || 'Internal'}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {task.status}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500 italic">No tasks available.</li>
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-100">System Information</h2>
          <div className="text-sm text-slate-600 space-y-4">
            <p>Welcome to the newly overhauled RDS Enterprise Dashboard.</p>
            <p><strong>Recent Updates:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Client Deep-Dive profiles are now active.</li>
              <li>Interactive Task Comments feature released.</li>
              <li>Authentication logic integrated.</li>
              <li>Real-time database hooks added to KPIs.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
