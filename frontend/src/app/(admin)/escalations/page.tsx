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
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-red-50 text-red-600 border border-red-200';
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
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
            Escalations
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Track and resolve high-priority client issues.</p>
        </div>
        <Link 
          href="/escalations/new" 
          className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition transform hover:-translate-y-1"
        >
          + Raise Escalation
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {escalations.map(esc => (
            <div 
              key={esc.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSeverityBadge(esc.severity)}`}>
                    {esc.severity}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                    {esc.client?.company_name || 'General'}
                  </span>
                </div>
                
                <select 
                  value={esc.status}
                  onChange={(e) => handleStatusChange(esc.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 shadow-sm cursor-pointer outline-none appearance-none ${getStatusBadge(esc.status)}`}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <h3 className="font-bold text-gray-900 text-xl mb-2">{esc.title}</h3>
              <p className="text-sm text-gray-600 mb-6 bg-red-50/50 p-3 rounded-lg border border-red-50/50">
                {esc.issue_description}
              </p>

              <div className="text-xs text-gray-400 font-medium flex justify-between items-center border-t pt-4">
                <span>Raised: {new Date(esc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && escalations.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">No Open Escalations</h2>
          <p className="text-gray-500 mt-2">All client accounts are healthy and issue-free.</p>
        </div>
      )}
    </div>
  );
}
