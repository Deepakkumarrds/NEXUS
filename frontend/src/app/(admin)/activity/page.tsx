'use client';

import { useState, useEffect } from 'react';

export default function ClientActivityPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<{summaries: any[], tasks: any[]}>({ summaries: [], tasks: [] });

  // Generate last 12 months for dropdown
  const availableMonths = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    availableMonths.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  }

  useEffect(() => {
    // Fetch clients on mount
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/clients?activeOnly=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setClients(data.data);
          if (data.data.length > 0) {
            setSelectedClient(data.data[0].id);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedClient && selectedMonth) {
      fetchActivity();
    }
  }, [selectedClient, selectedMonth]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Parse month to start/end dates
      const [monthStr, yearStr] = selectedMonth.split(' ');
      const monthIndex = new Date(Date.parse(monthStr +" 1, 2012")).getMonth();
      const year = parseInt(yearStr);
      
      const startDate = new Date(year, monthIndex, 1).toISOString();
      const endDate = new Date(year, monthIndex + 1, 0).toISOString();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/tracker/activity?client_id=${selectedClient}&startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActivityData({
          summaries: data.summaries || [],
          tasks: data.tasks || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'In Progress': return 'bg-amber-100 text-amber-700';
      case 'Review': return 'bg-blue-100 text-blue-700';
      case 'Pending':
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Client Activity</h1>
          <p className="text-sm text-slate-500 mt-1">Unified view of all daily summaries and tasks for manual review.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 pl-3 pr-10"
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 pl-3 pr-10"
          >
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
          Loading activity data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Summaries Column */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Daily Summaries</h2>
              <p className="text-xs text-slate-500">Logs from the Daily Tracker</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {activityData.summaries.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">No summaries found for this month.</div>
              ) : (
                <div className="space-y-4">
                  {activityData.summaries.map((summary, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{summary.department}</span>
                        <span className="text-xs text-slate-400">{new Date(summary.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary.summary_text || '--'}</p>
                      {summary.status_color && (
                        <div className="mt-2 flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${summary.status_color === 'Green' ? 'bg-green-500' : summary.status_color === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                          <span className="text-xs text-slate-500">{summary.status_color}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks Column */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Completed & Active Tasks</h2>
              <p className="text-xs text-slate-500">Tasks updated in this period</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {activityData.tasks.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">No tasks found for this month.</div>
              ) : (
                <div className="space-y-4">
                  {activityData.tasks.map((task, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-medium text-slate-900">{task.title}</h3>
                        <span className={`px-2 py-0.5 ml-2 text-[10px] uppercase font-bold rounded-full ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">{task.department || 'General'}</span>
                        <span className="text-xs text-slate-500">Last updated: {new Date(task.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
