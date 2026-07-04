'use client';

import { useEffect, useState } from 'react';

type SOW = { id: string; sow_name: string; total_value: number; status: string };
type Report = { id: string; report_name: string; report_month: string };

export default function ClientDashboard() {
  const [sows, setSows] = useState<SOW[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      setUserName(user.name);
      fetchDashboardData(user.client_id);
    }
  }, []);

  const fetchDashboardData = async (clientId: string) => {
    try {
      // In a real scenario, we'd have a specific endpoint or pass client_id as a query param.
      // Since it's MVP, we just fetch all and filter client side, or better, the backend should be updated to only return data for this client_id.
      // For now, let's fetch all and filter since it's a quick prototype, but a production app MUST filter backend side.
      const [sowRes, reportRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/sows'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/reports')
      ]);

      const sowData = await sowRes.json();
      const reportData = await reportRes.json();

      if (sowData.data) {
        setSows(sowData.data.filter((s: any) => s.client_id === clientId));
      }
      if (reportData.data) {
        setReports(reportData.data.filter((r: any) => r.client_id === clientId));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeSows = sows.length;
  const recentReports = reports.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-20 -mb-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {userName}!</h1>
          <p className="text-indigo-100 max-w-2xl text-lg">
            Your performance portal is up to date. Review your latest analytics reports and track your active contracts all in one secure place.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Reports Available</p>
              <h3 className="text-3xl font-bold text-slate-900">{loading ? '-' : recentReports}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2">Access your monthly deliverables and strategy decks.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Contracts</p>
              <h3 className="text-3xl font-bold text-slate-900">{loading ? '-' : activeSows}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2">Track the progress of your active statements of work.</p>
        </div>
      </div>
    </div>
  );
}
