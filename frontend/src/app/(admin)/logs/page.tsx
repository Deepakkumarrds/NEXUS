'use client';

import { useEffect, useState } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any>({ loginLogs: [], activityLogs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/logs')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setLogs(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Audit trail of logins and system activity.</p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading logs...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Login Logs */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">Recent Logins</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {logs.loginLogs && logs.loginLogs.length > 0 ? (
                logs.loginLogs.map((log: any) => (
                  <li key={log.id} className="p-4 text-sm hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-slate-900">{log.user?.name || 'Unknown User'}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{log.ip_address}</p>
                      <p className="text-xs text-slate-400">{new Date(log.login_time).toLocaleString()}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-4 text-sm text-slate-500 italic">No login records found.</li>
              )}
            </ul>
          </div>

          {/* Activity Logs */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">System Activity</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {logs.activityLogs && logs.activityLogs.length > 0 ? (
                logs.activityLogs.map((log: any) => (
                  <li key={log.id} className="p-4 text-sm hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{log.user?.name} on {log.entity_type} ({log.entity_id})</p>
                    <p className="text-xs text-slate-400 mt-1 text-right">{new Date(log.created_at).toLocaleString()}</p>
                  </li>
                ))
              ) : (
                <li className="p-4 text-sm text-slate-500 italic">No activity records found.</li>
              )}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
