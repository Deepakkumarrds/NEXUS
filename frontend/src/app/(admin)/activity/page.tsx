'use client';

import { useState, useEffect, useMemo } from 'react';

export default function ClientActivityPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<{summaries: any[], tasks: any[]}>({ summaries: [], tasks: [] });
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

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

  const groupedData = useMemo(() => {
    const map: Record<string, Record<string, { summary: any, tasks: any[] }>> = {};

    // Group summaries by Date -> Department
    activityData.summaries.forEach(s => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      const dept = s.department || 'General';
      if (!map[dateStr]) map[dateStr] = {};
      if (!map[dateStr][dept]) map[dateStr][dept] = { summary: null, tasks: [] };
      map[dateStr][dept].summary = s;
    });

    // Group tasks by Date -> Department
    activityData.tasks.forEach(t => {
      // Use completed_at if it exists, else updated_at
      const dateVal = t.completed_at || t.updated_at;
      const dateStr = new Date(dateVal).toISOString().split('T')[0];
      const dept = t.department || 'General';
      if (!map[dateStr]) map[dateStr] = {};
      if (!map[dateStr][dept]) map[dateStr][dept] = { summary: null, tasks: [] };
      map[dateStr][dept].tasks.push(t);
    });

    // Convert map to sorted array (descending by date)
    const sortedDates = Object.keys(map).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Automatically expand the first date if not already set
    if (sortedDates.length > 0 && Object.keys(expandedDays).length === 0) {
      setExpandedDays({ [sortedDates[0]]: true });
    }

    return sortedDates.map(dateStr => {
      const depts = Object.keys(map[dateStr]).sort();
      return {
        date: dateStr,
        departments: depts.map(dept => ({
          name: dept,
          summary: map[dateStr][dept].summary,
          tasks: map[dateStr][dept].tasks
        }))
      };
    });
  }, [activityData]);

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Activity</h1>
          <p className="text-sm text-slate-500 mt-1">Unified day-by-day view grouped by service department.</p>
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
      ) : groupedData.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <p className="text-lg font-medium text-slate-700">No activity logged.</p>
          <p className="text-sm mt-1">There are no tasks or summaries recorded for {selectedMonth}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedData.map((dayData, dayIdx) => (
            <div key={dayIdx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => toggleDay(dayData.date)}
                className="w-full bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {new Date(dayData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                </div>
                <div className="text-slate-400">
                  {expandedDays[dayData.date] ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  )}
                </div>
              </button>
              
              {expandedDays[dayData.date] && (
                <div className="divide-y divide-slate-100">
                  {dayData.departments.map((deptData, deptIdx) => (
                    <div key={deptIdx} className="p-4 sm:p-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                        <span className="bg-slate-200 w-1.5 h-1.5 rounded-full mr-2"></span>
                        {deptData.name}
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 ml-2 border-l-2 border-slate-100 pl-4 sm:pl-5">
                      
                      {/* Left: Summary */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                          Daily Summary
                        </h4>
                        {deptData.summary ? (
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{deptData.summary.summary_text || '--'}</p>
                            <div className="mt-3 flex items-center justify-between">
                              {deptData.summary.status_color && (
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-1.5 ${deptData.summary.status_color === 'Green' ? 'bg-green-500' : deptData.summary.status_color === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                  <span className="text-xs font-medium text-slate-600">{deptData.summary.status_color}</span>
                                </div>
                              )}
                              {deptData.summary.updater?.name && (
                                <div className="flex items-center text-xs text-slate-500">
                                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                  {deptData.summary.updater.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic">No summary logged for this service.</div>
                        )}
                      </div>

                      {/* Right: Tasks */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                          Tasks Completed/Updated
                        </h4>
                        {deptData.tasks.length > 0 ? (
                          <ul className="space-y-3">
                            {deptData.tasks.map((task: any) => (
                              <li key={task.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div>
                                  <span className="text-sm text-slate-800 font-medium block">{task.title}</span>
                                  {task.assignee?.name && (
                                    <span className="text-xs text-slate-500 mt-1 flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                      {task.assignee.name}
                                    </span>
                                  )}
                                </div>
                                <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${getStatusBadgeClass(task.status)}`}>
                                  {task.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-slate-400 italic">No tasks logged for this service.</div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
