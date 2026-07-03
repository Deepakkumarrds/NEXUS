'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function ClientReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const includeProfile = searchParams.get('profile') === 'true';
  const includeTasks = searchParams.get('tasks') === 'true';
  const includeComms = searchParams.get('comms') === 'true';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, tasksRes, commsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/clients/${clientId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/tasks?client_id=${clientId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com'}/api/communications`)
        ]);
        
        const clientData = await clientRes.json();
        const tasksData = await tasksRes.json();
        const commsData = await commsRes.json();
        
        const client = clientData.data;
        const allTasks = tasksData.data || [];
        const allComms = commsData.data ? commsData.data.filter((c: any) => c.client_id === clientId) : [];
        
        const start = new Date(startParam || '');
        start.setHours(0, 0, 0, 0);
        const end = new Date(endParam || '');
        end.setHours(23, 59, 59, 999);
        
        const filteredTasks = allTasks.filter((t: any) => {
          const d = new Date(t.created_at);
          return d >= start && d <= end;
        });
        
        const filteredComms = allComms.filter((c: any) => {
          const d = new Date(c.created_at);
          return d >= start && d <= end;
        });
        
        setData({
          client,
          tasks: filteredTasks,
          comms: filteredComms,
          startDate: startParam,
          endDate: endParam
        });
        
        setLoading(false);
        
        // Wait a tiny bit for render, then trigger print
        setTimeout(() => {
          window.print();
        }, 800);
        
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    if (clientId && startParam && endParam) {
      fetchData();
    }
  }, [clientId, startParam, endParam]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Generating Document...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-rose-500">Error loading report data.</div>;

  const { client, tasks, comms, startDate, endDate } = data;

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans print:p-0 p-8 max-w-[21cm] mx-auto shadow-xl print:shadow-none my-8 print:my-0">
      {/* Hide print button when printing */}
      <div className="mb-8 print:hidden flex justify-end">
        <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Work Report</h1>
          <h2 className="text-xl font-semibold text-slate-500">{client.company_name}</h2>
        </div>
        <div className="text-right text-sm font-medium text-slate-500">
          <p>Generated: {new Date().toLocaleDateString()}</p>
          <p>Period: {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Profile & SOW Section */}
      {includeProfile && (
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-indigo-900 uppercase tracking-wider">Profile & Scope of Work</h3>
          
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Brand Name</p>
              <p className="font-semibold">{client.brand_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Industry</p>
              <p className="font-semibold">{client.industry || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Services / SOW</p>
              <p className="font-semibold">{client.service_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retainer Value</p>
              <p className="font-semibold">{client.retainer_value ? `₹${client.retainer_value.toLocaleString('en-IN')}/mo` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Primary Contact</p>
              <p className="font-semibold">{client.primary_contact_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Internal SPOC</p>
              <p className="font-semibold">{client.spoc_name || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Section */}
      {includeTasks && (
        <div className="mb-10">
          <h3 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-indigo-900 uppercase tracking-wider">Tasks Log</h3>
          
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task: any) => (
                <div key={task.id} className="border border-slate-200 rounded-lg p-4 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">{task.status}</span>
                  </div>
                  <div 
                    className="text-sm text-slate-600 mb-3"
                    dangerouslySetInnerHTML={{ __html: task.description || 'No description provided.' }}
                  />
                  <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <p>Created: {new Date(task.created_at).toLocaleDateString()}</p>
                    <p>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                    <p>Assignee: {task.assignee ? task.assignee.name : 'Unassigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic p-4 bg-slate-50 rounded">No tasks logged during this period.</p>
          )}
        </div>
      )}

      {/* Communications / MoM Section */}
      {includeComms && (
        <div className="mb-10">
          <h3 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-indigo-900 uppercase tracking-wider">Minutes of Meeting & Communications</h3>
          
          {comms.length > 0 ? (
            <div className="space-y-6">
              {comms.map((comm: any) => (
                <div key={comm.id} className="border-l-4 border-indigo-500 pl-4 py-2 page-break-inside-avoid">
                  <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-600 uppercase">
                    <span>{comm.communication_type}</span>
                    <span className="text-slate-300">•</span>
                    <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{comm.subject}</h4>
                  
                  <div className="bg-slate-50 p-4 rounded-r-lg border border-l-0 border-slate-100 mb-3">
                    <div className="text-sm text-slate-700 space-y-2" dangerouslySetInnerHTML={{ __html: comm.summary || 'No summary details.' }} />
                  </div>
                  
                  {comm.next_action && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Next Action Items</p>
                      <p className="text-sm font-semibold text-slate-800">{comm.next_action}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic p-4 bg-slate-50 rounded">No communications logged during this period.</p>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-slate-200 text-center text-sm font-medium text-slate-400 page-break-inside-avoid">
        <p>End of Report</p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
