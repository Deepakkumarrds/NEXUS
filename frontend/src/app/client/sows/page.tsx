'use client';

import { useEffect, useState } from 'react';

type SOWItem = { deliverable_name: string; status: string };
type SOW = { 
  id: string; 
  sow_name: string; 
  total_value: number; 
  start_date: string; 
  end_date: string; 
  items: SOWItem[];
  client_id: string;
};

export default function ClientSOWsPage() {
  const [sows, setSows] = useState<SOW[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      fetchSOWs(user.client_id);
    }
  }, []);

  const fetchSOWs = async (clientId: string) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/sows');
      const data = await res.json();
      if (data && data.data) {
        // Filter by client_id to ensure they only see their own SOWs
        const clientSows = data.data.filter((s: any) => s.client_id === clientId);
        setSows(clientSows);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching SOWs:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Contracts & SOWs</h1>
        <p className="text-slate-500 mt-2">Track the specific deliverables and timelines for all your current engagements.</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
          Loading your contracts...
        </div>
      ) : sows.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">No active contracts found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">You currently don't have any active Statements of Work in the system.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sows.map(sow => {
            const completedItems = sow.items?.filter(i => i.status === 'Completed').length || 0;
            const totalItems = sow.items?.length || 0;
            const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

            return (
              <div key={sow.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{sow.sow_name}</h2>
                    <div className="flex items-center text-sm text-slate-500 mt-2 space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(sow.start_date).toLocaleDateString()} - {new Date(sow.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Total Value: ₹{(sow.total_value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-48 text-right">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className={progress === 100 ? 'text-green-600' : 'text-indigo-600'}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Project Deliverables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sow.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-slate-700">{item.deliverable_name}</span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          item.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                          item.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                    {(!sow.items || sow.items.length === 0) && (
                      <div className="col-span-2 text-sm text-slate-500 italic">No deliverables specified.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
