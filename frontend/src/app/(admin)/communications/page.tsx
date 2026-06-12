'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Log = {
  id: string;
  communication_type: string;
  subject: string;
  summary: string;
  follow_up_date: string;
  created_at: string;
  client?: { company_name: string };
  creator?: { name: string };
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/communications')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setLogs(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching logs:', error);
        setLoading(false);
      });
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Call': return '📞';
      case 'Email': return '✉️';
      case 'WhatsApp': return '💬';
      case 'Meeting': return '🤝';
      default: return '📝';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Communication Logs</h1>
          <p className="text-gray-500 mt-1">Track every interaction and follow-up across all clients.</p>
        </div>
        <Link 
          href="/communications/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Log Communication
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl pt-1">{getTypeIcon(log.communication_type)}</div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {log.client?.company_name || 'General'} <span className="text-gray-400 font-normal mx-2">|</span> {log.subject}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">{log.summary}</p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 font-medium">
                        <span className="bg-gray-100 px-2 py-1 rounded">By: {log.creator?.name || 'Unknown'}</span>
                        <span>Logged on: {new Date(log.created_at).toLocaleDateString()}</span>
                        {log.follow_up_date && (
                          <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                            Follow-up: {new Date(log.follow_up_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-8 text-center text-gray-500">No communication logs found. Click "Log Communication" to get started.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
