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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com';
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
        <Link href="/clients" className="block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Active Clients</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalClients}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Currently managed</p>
        </Link>
        
        <Link href="/tasks" className="block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Tasks Pending</p>
          <p className="text-3xl font-bold text-slate-900">{stats.pendingTasks}</p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Requires action
          </p>
        </Link>
        
        <Link href="/escalations" className="block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.openEscalations > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Open Escalations</p>
          <p className="text-3xl font-bold text-slate-900">{stats.openEscalations}</p>
          <p className={`text-xs mt-2 font-medium flex items-center ${stats.openEscalations > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {stats.openEscalations > 0 ? 'Urgent attention needed' : 'All clear'}
          </p>
        </Link>
        
        {isAdmin && (
          <Link href="/sows" className="block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total SOW Value</p>
            <p className="text-3xl font-bold text-slate-900">₹{stats.totalSowValue ? stats.totalSowValue.toLocaleString('en-IN') : '0'}</p>
            <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Active contracts
            </p>
          </Link>
        )}
      </div>

      {/* Main Data Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Task Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Pending by Department</h2>
            <Link href="/tasks" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">Tasks</Link>
          </div>
          <div className="space-y-4 mt-4">
            {stats.departmentTasks && stats.departmentTasks.length > 0 ? (
              stats.departmentTasks.map((dept: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">{dept.department}</span>
                  <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold text-indigo-600 shadow-sm border border-slate-200">{dept.count} pending</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center p-4">No department tasks pending.</p>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
            <Link href="/tasks" className="text-rose-600 text-sm font-semibold hover:text-rose-800 transition-colors">View All</Link>
          </div>
          <ul className="space-y-3">
            {stats.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
              stats.upcomingDeadlines.map((task: any) => (
                <li key={task.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex flex-col">
                    <Link href={`/tasks/${task.id}`} className="text-slate-800 font-semibold hover:text-indigo-600 transition-colors text-sm">
                      {task.title}
                    </Link>
                    <span className="text-slate-500 text-[10px] mt-0.5 font-medium">{task.client?.company_name || 'Internal'}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100 whitespace-nowrap">
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500 italic p-4 text-center">No upcoming deadlines.</li>
            )}
          </ul>
        </div>

        {/* Team Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Top Performers</h2>
            <Link href="/team" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">Team</Link>
          </div>
          <div className="space-y-3">
            {stats.teamPerformance && stats.teamPerformance.length > 0 ? (
              stats.teamPerformance.map((user: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-emerald-600">{user.points}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Est. Hours Done</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center p-4">No completed tasks yet.</p>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Communications</h2>
            <Link href="/communications" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">Logs</Link>
          </div>
          <div className="space-y-4">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((log: any, i: number) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                    {i !== stats.recentActivity.length - 1 && <div className="w-0.5 h-full bg-slate-100 my-1"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-bold text-slate-800">{log.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-indigo-600">{log.client?.company_name}</span> • {log.communication_type} by {log.creator?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center p-4">No recent activity.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
