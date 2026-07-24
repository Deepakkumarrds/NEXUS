'use client';

import { useEffect, useState } from 'react';

export default function SowResultsTab() {
  const [loading, setLoading] = useState(true);
  const [sows, setSows] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchSows(userData);
  }, []);

  const canViewFinancials = (u: any) => {
    if (!u) return false;
    const role = u.role?.role_name || u.role_name || u.role || '';
    const email = (u.email || '').toLowerCase();
    
    if (role === 'Super Admin' || role === 'Admin') return true;
    if (email.includes('utkarsh') || email.includes('admin') || email.includes('gowtham')) return true;
    
    return false;
  };

  const fetchSows = (u?: any) => {
    const currentUser = u || user;
    const role = currentUser?.role?.role_name || currentUser?.role_name || currentUser?.role || '';
    const email = currentUser?.email || '';
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com'}/api/sows?role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSows(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching SOWs:', err);
        setLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this SOW? This will remove all associated monthly data.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com'}/api/sows/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSows(sows.filter(s => s.id !== id));
      } else {
        alert('Failed to delete SOW');
      }
    } catch (error) {
      console.error('Error deleting SOW:', error);
      alert('Error connecting to backend server.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">Approved</span>;
      case 'Pending Approval':
        return <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-amber-200">Pending Approval</span>;
      case 'Rejected':
        return <span className="bg-rose-100 text-rose-800 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-rose-200">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-slate-200">Draft</span>;
    }
  };

  const showFinancials = canViewFinancials(user);

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">SOW Results & Active Scope</h2>
          <p className="text-xs text-slate-500 mt-0.5">Overview of created SOWs, approval statuses, and monthly scopes.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading SOW records...</div>
      ) : sows.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          No SOW records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 bg-slate-50">
                <th className="p-3.5">Brand Name</th>
                <th className="p-3.5">SOW Title</th>
                <th className="p-3.5">Month</th>
                {showFinancials && <th className="p-3.5">Value</th>}
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sows.map(sow => (
                (sow.months || []).map((month: any, idx: number) => (
                  <tr key={`${sow.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      {sow.client?.company_name || 'Unknown Client'}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {sow.sow_name}
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">
                      {month.month_year}
                    </td>
                    {showFinancials && (
                      <td className="p-3.5 font-bold text-slate-900">
                        ₹{(parseFloat(month.value) || 0).toLocaleString()}
                      </td>
                    )}
                    <td className="p-3.5">
                      {getStatusBadge(month.approval_status)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a 
                          href={`/sows/${sow.id}`} 
                          className="font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Edit
                        </a>
                        <button 
                          type="button"
                          onClick={() => handleDelete(sow.id)}
                          className="font-bold text-rose-600 hover:text-rose-900 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
