'use client';

import { useEffect, useState } from 'react';

export default function SowApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [sows, setSows] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchSows(userData);
  }, []);

  const canViewFinancials = (userObj: any) => {
    if (!userObj) return false;
    const role = userObj.role?.role_name || userObj.role_name || userObj.role || '';
    const email = (userObj.email || '').toLowerCase();
    
    if (role === 'Super Admin' || role === 'Admin') return true;
    if (email.includes('utkarsh') || email.includes('admin') || email.includes('gowtham')) return true;
    
    return false;
  };

  const fetchSows = (u?: any) => {
    const currentUser = u || user;
    setLoading(true);
    const role = currentUser?.role?.role_name || currentUser?.role_name || currentUser?.role || '';
    const email = currentUser?.email || '';
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com'}/api/sows?approval_status=Pending Approval&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`)
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
    setProcessingId(monthId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com'}/api/sows/month/${monthId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });
      
      if (response.ok) {
        fetchSows();
      } else {
        alert('Failed to approve SOW month.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (sowId: string, monthId: string) => {
    if (!window.confirm('Are you sure you want to reject this SOW contract month?')) return;
    setProcessingId(monthId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com'}/api/sows/month/${monthId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });
      
      if (response.ok) {
        fetchSows();
      } else {
        alert('Failed to reject SOW month.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    } finally {
      setProcessingId(null);
    }
  };

  // Flatten the SOWs and Months to render easily
  const pendingMonths = sows.flatMap(sow => {
    return (sow.months || [])
      .filter((m: any) => m.approval_status === 'Pending Approval')
      .map((m: any) => ({
        ...m,
        sow_name: sow.sow_name,
        client_name: sow.client?.company_name,
        sow_id: sow.id
      }));
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">SOW Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">Review, approve, or reject monthly deliverable contracts submitted for client accounts.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-xl border border-slate-200 h-40 shadow-xs"></div>
          ))}
        </div>
      ) : pendingMonths.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl shadow-xs border border-slate-200">
          <p className="font-heading font-semibold text-slate-700 text-base">All caught up!</p>
          <p className="text-xs text-slate-400 mt-1">No pending SOW contracts require approval right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingMonths.map(month => (
            <div key={month.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all hover:border-slate-300">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full tracking-wider border border-amber-200">
                      Pending Approval
                    </span>
                    <h3 className="font-heading text-sm font-bold text-slate-900">{month.client_name} - {month.sow_name}</h3>
                  </div>
                  <p className="font-heading text-lg font-bold text-indigo-700">{month.month_year}</p>
                </div>
                
                {canViewFinancials(user) && (
                  <div className="sm:text-right bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Value</p>
                    <p className="text-xl font-extrabold text-slate-900">₹{(parseFloat(month.value) || 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {/* Deliverables List */}
              <div className="p-6 space-y-3">
                <h4 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">Deliverables Scope</h4>
                <div className="grid grid-cols-1 gap-2">
                  {month.items && month.items.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        <span>{item.deliverable_name}</span>
                      </div>
                      <span className="font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                        Qty: {item.committed_qty || 1}
                      </span>
                    </div>
                  ))}
                  {(!month.items || month.items.length === 0) && (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                      No deliverables specified.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  disabled={processingId === month.id}
                  onClick={() => handleReject(month.sow_id, month.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                >
                  Reject Contract
                </button>

                <button 
                  type="button"
                  disabled={processingId === month.id}
                  onClick={() => handleApprove(month.sow_id, month.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50"
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

