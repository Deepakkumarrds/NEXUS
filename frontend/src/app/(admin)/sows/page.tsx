'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SowsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sowTasks, setSowTasks] = useState<any[]>([]);
  
  const currentMonthString = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user?.role_name === 'Admin' || user?.role_name === 'Management');
    fetchSowTasks();
  }, []);

  const fetchSowTasks = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks?is_sow=true`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSowTasks(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching SOW tasks:', err);
        setLoading(false);
      });
  };

  // Compute available filter options
  const uniqueBrands = Array.from(new Set(sowTasks.map(t => t.client?.company_name).filter(Boolean))).sort();
  
  const availableMonthsRaw = Array.from(new Set(sowTasks.map(task => {
    const d = new Date(task.updated_at);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  })));
  if (!availableMonthsRaw.includes(currentMonthString)) availableMonthsRaw.push(currentMonthString);
  const availableMonths = availableMonthsRaw.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending

  const filteredTasks = sowTasks.filter(task => {
    // Month Match
    let monthMatch = true;
    if (selectedMonth !== 'All') {
      const taskDate = new Date(task.updated_at);
      const selDate = new Date(selectedMonth);
      monthMatch = taskDate.getMonth() === selDate.getMonth() && taskDate.getFullYear() === selDate.getFullYear();
    }

    // Status Match
    let statusMatch = true;
    if (selectedStatus !== 'All') {
      statusMatch = task.status === selectedStatus;
    }

    // Brand Match
    let brandMatch = true;
    if (selectedBrand !== 'All') {
      brandMatch = task.client?.company_name === selectedBrand;
    }

    return monthMatch && statusMatch && brandMatch;
  });

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
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Scope of Work Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Unified view of all active and completed SOW deliverables.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-slate-200 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Month Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Month</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm min-w-[140px]"
                >
                  <option value="All">All Time Overview</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m as string}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm min-w-[140px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Brand</label>
                <select 
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm min-w-[140px]"
                >
                  <option value="All">All Brands</option>
                  {uniqueBrands.map(b => (
                    <option key={b as string} value={b as string}>{b as string}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200">
              Showing {filteredTasks.length} tasks
            </div>
          </div>

          {/* Master Table */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <p>No SOW tasks found matching the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold shadow-sm">
                    <th className="p-4">Brand</th>
                    <th className="p-4 w-[20%]">Task Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">WIP</th>
                    <th className="p-4">Review</th>
                    <th className="p-4">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{task.client?.company_name || 'N/A'}</td>
                      <td className="p-4 text-slate-700 font-medium">
                        <Link href={`/tasks/${task.id}`} className="hover:text-indigo-600 hover:underline line-clamp-2">
                          {task.title}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{task.department || 'N/A'}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{new Date(task.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{task.started_at ? new Date(task.started_at).toLocaleDateString() : '-'}</td>
                      <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{task.review_at ? new Date(task.review_at).toLocaleDateString() : '-'}</td>
                      <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
