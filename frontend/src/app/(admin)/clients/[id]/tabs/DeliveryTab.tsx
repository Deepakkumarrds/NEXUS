'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DeliveryTab({ client, clientId, fetchClientDetails }: any) {


  const [monthlyDepartment, setMonthlyDepartment] = useState('Social Media');
  const [monthlyMonthYear, setMonthlyMonthYear] = useState('');
  const [monthlyDocumentLink, setMonthlyDocumentLink] = useState('');
  const [monthlyFilter, setMonthlyFilter] = useState('All');

  const handleAddMonthlyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyDepartment || !monthlyMonthYear || !monthlyDocumentLink) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/monthly-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: monthlyDepartment,
          month_year: monthlyMonthYear,
          document_link: monthlyDocumentLink
        })
      });
      if (res.ok) {
        toast.success('Monthly plan added');
        setMonthlyMonthYear('');
        setMonthlyDocumentLink('');
        fetchClientDetails();
      } else {
        toast.error('Failed to add monthly plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding monthly plan');
    }
  };

  const handleDeleteMonthlyPlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/monthly-plans/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Monthly plan deleted');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRemarks = async (itemId: string, remarks: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      });
      if (res.ok) {
        toast.success('Summary saved');
        fetchClientDetails();
      } else {
        toast.error('Failed to save summary');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving summary');
    }
  };

  return (
    <div className="space-y-6">
      {/* SOW Deliverables Table (Defined vs Delivered vs Pending) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              🛡️ SOW Deliverables Tracker (Defined vs Delivered)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Compares Utkarsh's defined contract deliverables against real-time completed team tasks for the month.
            </p>
          </div>
          {client.sow_summary && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                Defined: <b>{client.sow_summary.total_defined || 0}</b>
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
                Delivered: <b>{client.sow_summary.total_delivered || 0}</b>
              </span>
              <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
                Pending: <b>{client.sow_summary.total_pending || 0}</b>
              </span>
            </div>
          )}
        </div>

        {client.sows && client.sows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Deliverable Name (Utkarsh)</th>
                  <th className="p-4">SOW Contract & Month</th>
                  <th className="p-4 text-center">Defined Quota</th>
                  <th className="p-4 text-center">Delivered (Completed)</th>
                  <th className="p-4 text-center">Pending / Remaining</th>
                  <th className="p-4 text-center">Scope Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const allItems = client.sows.flatMap((sow: any) => 
                    sow.months?.flatMap((month: any) => 
                      month.items?.map((item: any, idx: number) => ({
                        sow,
                        month,
                        item,
                        idx
                      })) || []
                    ) || []
                  );

                  if (allItems.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          No SOW contract deliverables defined for this client yet.
                        </td>
                      </tr>
                    );
                  }

                  return allItems.map(({ sow, month, item, idx }: any) => {
                    const definedQty = item.committed_qty || 1;
                    const deliveredQty = item.tasks ? item.tasks.filter((t: any) => t.status === 'Completed').length : 0;
                    const pendingQty = Math.max(0, definedQty - deliveredQty);
                    const usagePct = Math.round((deliveredQty / definedQty) * 100);

                    let statusTag = { text: 'In Scope', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    if (deliveredQty > definedQty) {
                      statusTag = { text: '🚨 SOW Exceeded', cls: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
                    } else if (usagePct >= 80) {
                      statusTag = { text: '⚠️ Approaching Limit', cls: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' };
                    }

                    return (
                      <tr key={`${sow.id}-${month.id}-${item.id || idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">
                          📌 {item.deliverable_name}
                        </td>
                        <td className="p-4 text-slate-600 text-xs">
                          <span className="font-medium text-slate-800 block">{sow.sow_name}</span>
                          <span className="text-slate-400">{month.month_year}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-indigo-950">
                          {definedQty}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-700">
                          {deliveredQty}
                        </td>
                        <td className="p-4 text-center font-bold text-amber-700">
                          {pendingQty}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${statusTag.cls}`}>
                            {statusTag.text}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500 font-medium">No SOWs have been drafted for this client.</p>
          </div>
        )}
      </div>

    </div>
  );
}
