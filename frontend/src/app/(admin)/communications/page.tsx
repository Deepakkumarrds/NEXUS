'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Communication = {
  id: string;
  communication_type: string;
  subject: string;
  summary: string;
  created_at: string;
  client?: { company_name: string };
  creator?: { name: string };
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/communications')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setLogs(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching communications:', error);
        setLoading(false);
      });
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Call': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
      case 'Email': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
      case 'WhatsApp': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>;
      case 'Meeting': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
      default: return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>;
    }
  };

  return (
    <div>
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading data...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Subject</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Logged By</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-slate-700">
                      <span className="text-slate-400 mr-2">{getTypeIcon(log.communication_type)}</span>
                      <span className="font-medium">{log.communication_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {log.client?.company_name || 'General'}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {log.subject}
                    {log.summary && (
                      <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">{log.summary}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {log.creator?.name || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No communication logs found. Click "Log Interaction" to record one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
