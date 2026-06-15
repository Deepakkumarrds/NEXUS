'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SowItem = {
  id: string;
  deliverable_name: string;
  status: string; // Pending, In Progress, Completed
};

type Sow = {
  id: string;
  sow_name: string;
  total_value: number;
  status: string;
  start_date: string;
  end_date: string;
  client?: { company_name: string };
  items?: SowItem[];
};

export default function SowsPage() {
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSows();
  }, []);

  const fetchSows = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/sows')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setSows(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching SOWs:', error);
        setLoading(false);
      });
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sows/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSows();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const calculateProgress = (items: SowItem[] = []) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.status === 'Completed').length;
    return Math.round((completed / items.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'In Progress': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Statement of Work (SOW)</h1>
          <p className="text-sm text-slate-500 mt-1">Track contracts, values, and project deliverables.</p>
        </div>
        <Link 
          href="/sows/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create SOW
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-slate-200 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sows.map(sow => {
            const progress = calculateProgress(sow.items);
            const isExpanded = expandedId === sow.id;

            return (
              <div 
                key={sow.id} 
                className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-1 ring-indigo-500' : 'hover:border-slate-300'}`}
              >
                <div className="p-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sow.id)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 mb-2 inline-block">
                        {sow.client?.company_name || 'General'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{sow.sow_name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {sow.total_value ? `₹${sow.total_value.toLocaleString('en-IN')}` : '-'}
                      </p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contract Value</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-medium mb-1.5 text-slate-600">
                      <span>Delivery Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {sow.start_date ? new Date(sow.start_date).toLocaleDateString() : 'N/A'} - {sow.end_date ? new Date(sow.end_date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-indigo-600 font-medium flex items-center">
                      {sow.items?.length || 0} Deliverables
                      <svg className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                </div>

                {/* Expanded Deliverables List */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Deliverables Status</h4>
                    {sow.items && sow.items.length > 0 ? (
                      <ul className="space-y-2">
                        {sow.items.map(item => (
                          <li key={item.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                            <span className="text-sm font-medium text-slate-800">{item.deliverable_name}</span>
                            <select 
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1.5 rounded outline-none border border-transparent hover:border-slate-300 cursor-pointer ${getStatusColor(item.status)}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No deliverables attached to this SOW.</p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
      
      {!loading && sows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">No SOWs Created</h2>
          <p className="text-slate-500 mt-1 text-sm">Draft your first contract to track deliverables.</p>
        </div>
      )}
    </div>
  );
}
