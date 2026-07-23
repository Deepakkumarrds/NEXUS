'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OverviewTab({ client, openEditModal }: any) {

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Profile Details */}
        <div className="space-y-8 lg:col-span-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Client Profile Details</h3>
              <button onClick={() => openEditModal()} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-semibold transition-colors flex items-center shadow-sm">
                Edit Profile
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Brand Code</span>
                <span className="font-medium text-slate-800 flex items-center gap-2">
                  {client.brand_shortcode ? (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      {client.brand_shortcode}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Industry</span>
                <span className="font-medium text-slate-800">{client.industry || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Primary Email</span>
                <span className="font-medium text-slate-800 flex items-center gap-2">
                  {client.email || 'N/A'}
                  {client.email && <button onClick={() => copyToClipboard(client.email)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Phone</span>
                <span className="font-medium text-slate-800 flex items-center gap-2">
                  {client.phone || 'N/A'}
                  {client.phone && <button onClick={() => copyToClipboard(client.phone)} className="text-slate-400 hover:text-indigo-600">Copy</button>}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Website</span>
                {client.website ? (
                  <span className="flex items-center gap-2">
                    <a href={client.website} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
                      {client.website}
                    </a>
                  </span>
                ) : (
                  <span className="font-medium text-slate-800">N/A</span>
                )}
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Retainer Value</span>
                <span className="font-medium text-slate-800">
                  {client.monthly_retainer_value ? `₹${client.monthly_retainer_value.toLocaleString()}/mo` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Account Manager (SPOC)</span>
                <span className="font-medium text-slate-800">{client.spoc_name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Primary Client Contact</span>
                <span className="font-medium text-slate-800">{client.primary_contact_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Recent Active Tasks */}
        <div className="space-y-8 lg:col-span-7">
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Recent Client Tasks</h3>
              <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">View All Tasks &rarr;</Link>
            </div>
            {client.tasks && client.tasks.length > 0 ? (
              <div className="space-y-2">
                {client.tasks.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">{task.title}</Link>
                    <span className={`px-2 py-0.5 rounded text-xs border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-4 text-center">No recent tasks logged for this client.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
