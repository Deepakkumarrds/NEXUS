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
      {/* SOW Deliverables Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            SOW Deliverables (Defined vs Delivered)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track specific deliverables agreed upon in the SOW against actual delivery status.
          </p>
        </div>


        {client.sows && client.sows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">SOW Name</th>
                  <th className="p-4">Month</th>
                  <th className="p-4">Defined Deliverable</th>
                  <th className="p-4 min-w-[300px]">Weekly Targets & Summary</th>
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
                        <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                          No specific deliverables have been defined for these SOWs yet.
                        </td>
                      </tr>
                    );
                  }

                  return allItems.map(({ sow, month, item, idx }: any) => (
                    <tr key={`${sow.id}-${month.id}-${item.id || idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">
                        {sow.sow_name}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">₹{sow.total_value?.toLocaleString() || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                        {month.month_year}
                      </td>
                      <td className="p-4 text-slate-800">
                        {item.deliverable_name}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-3">
                          {/* List of Weekly Targets */}
                          {item.tasks && item.tasks.filter((t: any) => t.is_weekly_target).length > 0 ? (
                            <ul className="space-y-2 mb-2">
                              {item.tasks.filter((t: any) => t.is_weekly_target).map((t: any) => (
                                <li key={t.id} className="flex items-center gap-2 text-xs">
                                  <span className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                  <span className={t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                                    {t.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No weekly targets linked.</p>
                          )}
                          
                          {/* Client Summary Area */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Summary</label>
                            <textarea
                              className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                              rows={2}
                              placeholder="Enter summary of deliverables..."
                              defaultValue={item.remarks || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (item.remarks || '')) {
                                  handleSaveRemarks(item.id, e.target.value);
                                }
                              }}
                            />
                            <p className="text-[9px] text-slate-400">Autosaves on click away</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ));
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
