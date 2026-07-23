'use client';

import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OverviewTab({ client, openEditModal }: any) {

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Client Profile Details (Horizontal Grid / Table Layout) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            🏢 Client Profile Details
          </h3>
          <button onClick={() => openEditModal()} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-semibold transition-colors flex items-center shadow-sm">
            Edit Profile
          </button>
        </div>

        {/* 4-Column Horizontal Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-1">
          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Brand Code</span>
            <span className="font-semibold text-slate-900 flex items-center gap-2 mt-1">
              {client.brand_shortcode ? (
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded border border-indigo-100">
                  {client.brand_shortcode}
                </span>
              ) : (
                <span className="text-slate-400">N/A</span>
              )}
            </span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Industry</span>
            <span className="font-semibold text-slate-900 block mt-1">{client.industry || 'N/A'}</span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Account Manager (SPOC)</span>
            <span className="font-semibold text-slate-900 block mt-1">{client.spoc_name || 'Unassigned'}</span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Primary Client Contact</span>
            <span className="font-semibold text-slate-900 block mt-1">{client.primary_contact_name || 'N/A'}</span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Primary Email</span>
            <span className="font-semibold text-slate-900 flex items-center justify-between gap-2 mt-1 truncate">
              <span className="truncate">{client.email || 'N/A'}</span>
              {client.email && <button onClick={() => copyToClipboard(client.email)} className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0">Copy</button>}
            </span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Phone</span>
            <span className="font-semibold text-slate-900 flex items-center justify-between gap-2 mt-1">
              <span>{client.phone || 'N/A'}</span>
              {client.phone && <button onClick={() => copyToClipboard(client.phone)} className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0">Copy</button>}
            </span>
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Website</span>
            {client.website ? (
              <a href={client.website} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 hover:underline block mt-1 truncate">
                {client.website}
              </a>
            ) : (
              <span className="font-semibold text-slate-900 block mt-1">N/A</span>
            )}
          </div>

          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide font-bold">Retainer Value</span>
            <span className="font-semibold text-slate-900 block mt-1">
              {client.monthly_retainer_value ? `₹${client.monthly_retainer_value.toLocaleString()}/mo` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

