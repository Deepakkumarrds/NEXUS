'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Communication = {
  id: string;
  communication_type: string;
  subject: string;
  summary: string;
  next_action: string | null;
  created_at: string;
  is_pinned: boolean;
  client?: { company_name: string };
  creator?: { name: string };
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [uniqueClients, setUniqueClients] = useState<string[]>([]);

  // Print state
  const [printLog, setPrintLog] = useState<Communication | null>(null);

  const fetchLogs = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/communications')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setLogs(data.data);
          const clients = Array.from(new Set(data.data.map((l: any) => l.client?.company_name).filter(Boolean))) as string[];
          setUniqueClients(clients);
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching communications:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const togglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentPin })
      });
      if (res.ok) {
        toast.success(currentPin ? 'Unpinned' : 'Pinned to top');
        fetchLogs();
      }
    } catch (err) { console.error(err); }
  };

  const deleteLog = async (id: string) => {
    if(!window.confirm('Are you sure you want to delete this communication log?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/communications/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Log deleted');
        fetchLogs();
      }
    } catch (err) { console.error(err); }
  };



  const triggerPrint = (log: Communication) => {
    setPrintLog(log);
    setTimeout(() => {
      window.print();
      setPrintLog(null);
    }, 500);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Call': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
      case 'Email': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
      case 'WhatsApp': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>;
      case 'Meeting': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
      default: return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>;
    }
  };

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = log.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (log.summary && log.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClient = clientFilter ? log.client?.company_name === clientFilter : true;
      return matchesSearch && matchesClient;
    })
    .sort((a, b) => {
      // Pinned logs first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {printLog && (
        <div className="print-container hidden print:block">
          <h1 className="text-3xl font-bold mb-2">Minutes of Meeting (MOM)</h1>
          <p className="text-sm text-gray-500 mb-8">Generated on {new Date().toLocaleDateString()}</p>
          
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div><strong>Client:</strong> {printLog.client?.company_name}</div>
            <div><strong>Date:</strong> {new Date(printLog.created_at).toLocaleString()}</div>
            <div><strong>Type:</strong> {printLog.communication_type}</div>
            <div><strong>Logged By:</strong> {printLog.creator?.name}</div>
          </div>
          
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Subject: {printLog.subject}</h2>
          
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-2">Summary & Notes</h3>
            <div className="text-gray-800 prose max-w-none" dangerouslySetInnerHTML={{ __html: printLog.summary || 'No notes available.' }} />
          </div>
          
          {printLog.next_action && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Action Items</h3>
              <ul className="list-disc pl-5">
                <li>{printLog.next_action}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Communications Log</h1>
            <p className="text-sm text-slate-500 mt-1">Audit trail of all client interactions and touchpoints.</p>
          </div>
          <Link 
            href="/communications/new" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Log Interaction
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Subject/Notes</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search MOMs..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Client</label>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
              <option value="">All Clients</option>
              {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading communications data...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type & Date</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Subject & Details</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`group hover:bg-slate-50/80 transition-colors ${log.is_pinned ? 'bg-amber-50/20' : ''}`}>
                    {/* Type & Date */}
                    <td className="py-4 px-4 align-top w-48">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-slate-400">{getTypeIcon(log.communication_type)}</span>
                        <span className="font-semibold text-slate-700">{log.communication_type}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    
                    {/* Client */}
                    <td className="py-4 px-4 align-top w-48">
                      <span className="font-medium text-slate-700">
                        {log.client?.company_name || 'Internal / General'}
                      </span>
                    </td>
                    
                    {/* Subject & Summary */}
                    <td className="py-4 px-4 align-top max-w-md">
                      <div className="mb-3">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subject</span>
                        <div className="font-semibold text-slate-900 leading-snug">{log.subject}</div>
                      </div>
                      
                      {log.summary && (
                        <div className="mb-3">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Summary</span>
                          <div className="text-slate-600 text-[13px] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all" dangerouslySetInnerHTML={{ __html: log.summary }}></div>
                        </div>
                      )}
                      
                      {log.next_action && (
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Action Item</span>
                          <div className="text-sm text-slate-800">
                            {log.next_action}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top w-32">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/communications/${log.id}?edit=true`}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition"
                          title="Edit Log"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </Link>
                        <button 
                          onClick={() => deleteLog(log.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                          title="Delete Log"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 text-sm">
                      No communications found. Click "Log Interaction" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
