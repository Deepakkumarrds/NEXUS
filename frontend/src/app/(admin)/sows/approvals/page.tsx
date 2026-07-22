'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SowApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [sows, setSows] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchSows();
  }, []);

  const fetchSows = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows?approval_status=Pending Approval`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSows(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching pending SOWs:', err);
        setLoading(false);
      });
  };

  const handleApprove = async (sowId: string, monthId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows/month/${monthId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });
      
      if (response.ok) {
        // Remove the approved month from local state or refetch
        fetchSows();
      } else {
        alert('Failed to approve SOW month.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  // Flatten the SOWs and Months to render easily
  const pendingMonths = sows.flatMap(sow => {
    return sow.months
      .filter((m: any) => m.approval_status === 'Pending Approval')
      .map((m: any) => ({
        ...m,
        sow_name: sow.sow_name,
        client_name: sow.client?.company_name,
        sow_id: sow.id
      }));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SOW Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve monthly deliverables submitted by Brand Managers.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-slate-200 h-48"></div>
          ))}
        </div>
      ) : pendingMonths.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-lg shadow-sm border border-slate-200">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="font-medium text-slate-600">All caught up!</p>
          <p className="text-sm mt-1">No pending SOWs require your approval.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingMonths.map(month => (
            <div key={month.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                      Pending Approval
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{month.client_name} - {month.sow_name}</h3>
                  </div>
                  <p className="text-lg font-bold text-indigo-700">{month.month_year}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Total Value</p>
                  <p className="text-lg font-semibold text-slate-900">₹{month.value.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Deliverables</h4>
                <ul className="space-y-2">
                  {month.items && month.items.map((item: any, idx: number) => (
                    <li key={item.id || idx} className="flex items-start text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                      <svg className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      {item.deliverable_name}
                    </li>
                  ))}
                  {(!month.items || month.items.length === 0) && (
                    <li className="text-sm text-slate-400 italic">No deliverables defined.</li>
                  )}
                </ul>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => handleApprove(month.sow_id, month.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                >
                  Approve Deliverables
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
