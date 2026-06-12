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
  client?: { company_name: string };
};

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = () => {
    fetch('http://localhost:5000/api/escalations')
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
      await fetch(`http://localhost:5000/api/escalations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEscalations();
    } catch (error) {
      console.error('Failed to update status', error);
    }
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading escalations...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Issue Title</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Severity</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Date Raised</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {escalations.map(esc => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(esc.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {escalations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No open escalations. All client accounts are healthy.
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
