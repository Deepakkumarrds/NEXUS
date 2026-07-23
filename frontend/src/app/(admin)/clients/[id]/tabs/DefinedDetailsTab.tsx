'use client';

import Link from 'next/link';

export default function DefinedDetailsTab({ client }: any) {
  return (
    <div className="space-y-6">
      {/* SOW Scope Tracker Card (Defined / Delivered / Pending) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              SOW Scope & Deliverable Quotas (Current Month)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tracks Utkarsh's defined contract deliverables against live completed team tasks.</p>
          </div>
          <Link href="/client/sows" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 transition-colors">
            Manage SOW Contracts &rarr;
          </Link>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-xl">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">1. Defined Scope</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-indigo-950">{client.sow_summary?.total_defined || 0}</span>
              <span className="text-xs text-indigo-700 font-medium">Items Committed</span>
            </div>
            <span className="text-[11px] text-indigo-500 mt-1 block">Set by Utkarsh in SOW contract</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-xl">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">2. Delivered (Completed)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-950">{client.sow_summary?.total_delivered || 0}</span>
              <span className="text-xs text-emerald-700 font-medium">Tasks Completed</span>
            </div>
            <span className="text-[11px] text-emerald-500 mt-1 block">Completed by team this month</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-5 rounded-xl">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">3. Pending / Active</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-950">{client.sow_summary?.total_pending || 0}</span>
              <span className="text-xs text-amber-700 font-medium">Tasks In Progress</span>
            </div>
            <span className="text-[11px] text-amber-500 mt-1 block">Pending deliverable tasks</span>
          </div>
        </div>

        {/* Deliverables Breakdown List */}
        {client.sow_summary?.deliverables && client.sow_summary.deliverables.length > 0 ? (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Deliverable Quota Breakdown:</h4>
            <div className="space-y-3">
              {client.sow_summary.deliverables.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-sm">
                  <div className="font-bold text-slate-900">
                    <span>{item.deliverable_name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-medium">
                    <span className="text-slate-600">Defined: <b className="text-slate-900 text-sm">{item.defined_qty}</b></span>
                    <span className="text-emerald-700">Delivered: <b className="text-emerald-900 text-sm">{item.delivered_qty}</b></span>
                    <span className="text-amber-700">Pending: <b className="text-amber-900 text-sm">{item.pending_qty}</b></span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'SOW Exceeded' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      item.status === 'Approaching Limit' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">No SOW contract deliverables defined for this client yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
