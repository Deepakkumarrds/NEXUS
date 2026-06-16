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

  const convertToTask = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/from-action-item/${id}`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success('Task created from Action Item!');
      } else {
        toast.error('Failed to create task');
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

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading data...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 w-10"></th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700 w-2/5">Subject & Summary</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Logged By</th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${log.is_pinned ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button onClick={() => togglePin(log.id, log.is_pinned)} className={`${log.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'} transition-colors`} title="Pin Communication">
                        <svg className="w-5 h-5" fill={log.is_pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-slate-700">
                        <span className="text-slate-400 mr-2">{getTypeIcon(log.communication_type)}</span>
                        <span className="font-medium">{log.communication_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {log.client?.company_name || 'General'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-bold mb-1">{log.subject}</div>
                      {log.summary && (
                        <div className="text-xs text-slate-500 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: log.summary }}></div>
                      )}
                      {log.next_action && (
                        <div className="mt-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 flex items-center justify-between">
                          <span><strong>Action:</strong> {log.next_action}</span>
                          <button onClick={() => convertToTask(log.id)} className="bg-indigo-600 text-white px-2 py-1 rounded shadow-sm hover:bg-indigo-700 transition">
                            Create Task
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div>{log.creator?.name || 'System'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => triggerPrint(log)} className="text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center ml-auto">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No communication logs found. Click "Log Interaction" to record one.
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
