'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Escalation = {
  id: string;
  title: string;
  issue_description: string;
  severity: string; // Low, Medium, High, Critical
  status: string; // Open, In Progress, Resolved
  resolution_notes: string;
  created_at: string;
  resolved_at: string | null;
  client?: { company_name: string };
};

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/escalations')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setEscalations(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching escalations:', error);
        setLoading(false);
      });
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/escalations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEscalations();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const deleteEscalation = async (id: string) => {
    if(!window.confirm('Are you sure you want to delete this escalation?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/escalations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchEscalations();
    } catch (err) { console.error(err); }
  };

  const filteredEscalations = escalations.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.client?.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter ? e.severity === severityFilter : true;
    const matchesStatus = statusFilter ? e.status === statusFilter : true;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getDuration = (created: string, resolved: string | null) => {
    const start = new Date(created).getTime();
    const end = resolved ? new Date(resolved).getTime() : new Date().getTime();
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    return `${days} days`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Escalations</h1>
          <p className="text-sm text-slate-500 mt-1">Track and resolve high-priority client issues.</p>
        </div>
        <Link 
          href="/escalations/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Raise Escalation
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Escalations</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search issue or client..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Severity</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading escalations...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700 w-1/3">Issue Title</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Severity</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Timeline</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredEscalations.map(esc => (
                <tr key={esc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {esc.title}
                    {esc.issue_description && (
                      <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">{esc.issue_description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {esc.client?.company_name || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getSeverityBadge(esc.severity)}`}>
                      {esc.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={esc.status}
                      onChange={(e) => handleStatusChange(esc.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer outline-none transition-colors ${getStatusBadge(esc.status)}`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-slate-500 mb-1">
                      Raised: {new Date(esc.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      {esc.status === 'Resolved' ? 'Resolved in ' : 'Open for '}{getDuration(esc.created_at, esc.resolved_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/escalations/${esc.id}?edit=true`}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition"
                        title="Edit Escalation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </Link>
                      <button 
                        onClick={() => deleteEscalation(esc.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                        title="Delete Escalation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEscalations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {escalations.length === 0 ? 'No open escalations. All client accounts are healthy.' : 'No escalations match your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
