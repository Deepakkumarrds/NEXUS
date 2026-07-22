'use client';

import { useEffect, useState } from 'react';

export default function BrandStatusTab() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setBrands(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching brands:', err);
        setLoading(false);
      });
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    setUpdatingId(clientId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_status: newStatus })
      });
      if (res.ok) {
        setBrands(prev => prev.map(b => b.id === clientId ? { ...b, client_status: newStatus } : b));
      } else {
        alert('Failed to update brand status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error connecting to backend server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleHealthChange = async (clientId: string, newHealth: string) => {
    setUpdatingId(clientId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ health_status: newHealth })
      });
      if (res.ok) {
        setBrands(prev => prev.map(b => b.id === clientId ? { ...b, health_status: newHealth } : b));
      } else {
        alert('Failed to update health status');
      }
    } catch (error) {
      console.error('Error updating health:', error);
      alert('Error connecting to backend server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFeedbackChange = async (clientId: string, newFeedback: string) => {
    setUpdatingId(clientId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ health_feedback: newFeedback })
      });
      if (res.ok) {
        setBrands(prev => prev.map(b => b.id === clientId ? { ...b, health_feedback: newFeedback } : b));
      } else {
        alert('Failed to update feedback');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Error connecting to backend server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search brands..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
          />
        </div>
        
        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200">
          Showing {filteredBrands.length} brands
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading brands...</div>
      ) : filteredBrands.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white">
          <p>No brands found matching your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold shadow-sm">
                <th className="p-4 w-[35%]">Brand Name</th>
                <th className="p-4 w-[20%]">Status</th>
                <th className="p-4 w-[15%]">Health</th>
                <th className="p-4 w-[30%]">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {filteredBrands.map(brand => (
                <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">
                    {brand.company_name}
                    {brand.brand_name && brand.brand_name !== brand.company_name && (
                      <span className="ml-2 text-xs text-slate-500 font-normal">({brand.brand_name})</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={brand.client_status || 'Active'}
                        onChange={(e) => handleStatusChange(brand.id, e.target.value)}
                        disabled={updatingId === brand.id}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-full max-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-r-8 border-transparent ${
                          brand.client_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          brand.client_status === 'Hold' ? 'bg-amber-100 text-amber-700' :
                          brand.client_status === 'Lost' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Hold">Hold</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={brand.health_status || 'Green'}
                        onChange={(e) => handleHealthChange(brand.id, e.target.value)}
                        disabled={updatingId === brand.id}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-full max-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-r-8 border-transparent ${
                          brand.health_status === 'Green' ? 'bg-emerald-100 text-emerald-700' :
                          brand.health_status === 'Yellow' ? 'bg-amber-100 text-amber-700' :
                          brand.health_status === 'Red' ? 'bg-rose-100 text-rose-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <option value="Green">Green</option>
                        <option value="Yellow">Yellow</option>
                        <option value="Red">Red</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={brand.health_feedback || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (brand.health_feedback || '')) {
                            handleFeedbackChange(brand.id, e.target.value);
                          }
                        }}
                        disabled={updatingId === brand.id}
                        placeholder="Add a note..."
                        className="border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none px-2 py-1 text-sm bg-transparent outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 placeholder-slate-400"
                      />
                      {updatingId === brand.id && (
                        <svg className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
