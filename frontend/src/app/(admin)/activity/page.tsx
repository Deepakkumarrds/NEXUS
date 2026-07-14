'use client';

import { useState, useEffect, useMemo } from 'react';

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

  const flatData = useMemo(() => {
    const list: any[] = [];
    const clientName = clients.find(c => c.id === selectedClient)?.company_name || '--';

    // Add summaries
    activityData.summaries.forEach(s => {
      list.push({
        id: 'sum_' + s.id,
        date: s.date,
        client: clientName,
        task: '--',
        summary: s.summary_text || '--',
        department: s.department || 'General',
        user: s.updater?.name || '--',
        status: s.status_color || '--'
      });
    });

    // Add tasks
    activityData.tasks.forEach(t => {
      const dateVal = t.completed_at || t.updated_at || t.created_at;
      list.push({
        id: 'task_' + t.id,
        date: dateVal,
        client: clientName,
        task: t.title,
        summary: '--',
        department: t.department || 'General',
        user: t.assignee?.name || '--',
        status: t.status || '--'
      });
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activityData]);

  const getStatusBadgeClass = (status: string) => {
    if (!status || status === '--') return 'bg-slate-100 text-slate-700';
    const s = status.toLowerCase();
    if (s.includes('completed') || s === 'green') return 'bg-emerald-100 text-emerald-700';
    if (s.includes('progress') || s === 'yellow') return 'bg-amber-100 text-amber-700';
    if (s.includes('review') || s === 'blue') return 'bg-blue-100 text-blue-700';
    if (s === 'red') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Activity</h1>
          <p className="text-sm text-slate-500 mt-1">Simple unified table view of all tasks and summaries.</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand</label>
            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 pl-3 pr-10 outline-none"
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Month</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 pl-3 pr-10 outline-none"
            >
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse">
          Loading activity timeline...
        </div>
      ) : flatData.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <p className="text-lg font-medium text-slate-700">No activity logged.</p>
          <p className="text-sm mt-1">There are no tasks or summaries recorded for {selectedMonth}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Summary</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {flatData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {row.client}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 min-w-[200px]">
                    <div className="line-clamp-2" title={row.task}>{row.task}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 min-w-[200px]">
                    <div className="line-clamp-2" title={row.summary}>{row.summary}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {row.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    {row.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
