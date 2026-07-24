'use client';
import { useEffect, useState } from 'react';

export default function DailyStatusTab({ client }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client?.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/communications`)
        .then(res => res.json())
        .then(data => {
          const clientComms = data.data ? data.data.filter((c: any) => c.client_id === client.id) : [];
          setLogs(clientComms);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [client]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-900 text-lg">Everyday Status</h3>
        <p className="text-xs text-slate-500 mt-1">Daily updates and logs for this client.</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading daily status...</div>
      ) : logs.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {logs.map((log, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
               <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-800 text-sm">{log.subject || log.communication_type}</h4>
                <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-600" dangerouslySetInnerHTML={{ __html: log.summary || 'No details provided' }}></p>
              {log.next_action && (
                <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <strong>Next Action:</strong> {log.next_action}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 italic">No daily status logs available.</p>
        </div>
      )}
    </div>
  );
}
