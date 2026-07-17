'use client';

import Link from 'next/link';

interface ClientHeaderProps {
  client: any;
  setShowExportModal: (val: boolean) => void;
}

export default function ClientHeader({ client, setShowExportModal }: ClientHeaderProps) {
  if (!client) return null;

  return (
    <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-sm font-medium text-slate-500 mb-4 space-x-2">
            <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center bg-slate-100/50 px-2 py-1 rounded-md">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/clients" className="hover:text-indigo-600 transition-colors bg-slate-100/50 px-2 py-1 rounded-md">
              Clients
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-900 font-semibold truncate max-w-[200px] bg-indigo-50 px-2 py-1 rounded-md">{client.company_name}</span>
          </nav>
          
          <div className="flex items-start gap-5">
            {client.logo ? (
              <img src={client.logo} alt={client.company_name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-slate-50" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 border-2 border-white shadow-md flex items-center justify-center text-indigo-500 font-bold text-2xl shrink-0">
                {client.company_name.substring(0, 1)}
              </div>
            )}
            
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                {client.company_name}
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                  client.client_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  client.client_status === 'Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {client.client_status}
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">{client.service_type || 'No services selected'} • Client since {new Date(client.created_at).getFullYear()}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {client.primary_contact_name && (
                  <div className="flex items-center text-sm text-slate-700 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg shadow-sm">
                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className="font-semibold mr-1.5">Client:</span> {client.primary_contact_name}
                  </div>
                )}
                {client.spoc_name && (
                  <div className="flex items-center text-sm text-slate-700 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg shadow-sm">
                    <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span className="font-semibold mr-1.5">SPOC:</span> {client.spoc_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions & Health Score Badge */}
        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-4 shrink-0">
          {client.health_scores && client.health_scores.length > 0 ? (
            <div className="flex flex-col items-end bg-white/60 p-3 rounded-2xl border border-white shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Overall Health</span>
              <div className={`flex items-center px-4 py-2 rounded-xl shadow-sm ${client.health_scores[0].risk_level === 'Critical' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white' : client.health_scores[0].risk_level === 'Risk' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'}`}>
                <span className="text-3xl font-black mr-3 drop-shadow-sm">{client.health_scores[0].overall_score}</span>
                <span className="text-xs font-bold uppercase tracking-wide opacity-90">{client.health_scores[0].risk_level}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end bg-white/60 p-3 rounded-2xl border border-white shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Overall Health</span>
              <div className="flex items-center px-4 py-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200">
                <span className="text-sm font-semibold uppercase tracking-wider">Pending</span>
              </div>
            </div>
          )}
          
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-md shadow-slate-900/20 text-sm font-semibold hover:bg-slate-800 transition active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
