'use client';

import { useEffect, useState } from 'react';

export default function SowResultsTab() {
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows`)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows/${id}`, {
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
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rejected</span>;
      case 'Pending Approval':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">Pending Approval</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">{status || 'Draft'}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading your SOW results...</div>
      ) : sows.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <p>No SOWs found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Brand</th>
                <th className="p-4">SOW Name</th>
                <th className="p-4">Month</th>
                <th className="p-4">Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sows.map(sow => (
                sow.months?.map((month: any, idx: number) => (
                  <tr key={`${sow.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">
                      {sow.client?.company_name || 'Unknown Client'}
                    </td>
                    <td className="p-4 text-slate-700">
                      {sow.sow_name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {month.month_year}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      ₹{parseFloat(month.value).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(month.approval_status)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a 
                          href={`/sows/${sow.id}`} 
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Edit
                        </a>
                        <button 
                          onClick={() => handleDelete(sow.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-900 transition-colors"
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
