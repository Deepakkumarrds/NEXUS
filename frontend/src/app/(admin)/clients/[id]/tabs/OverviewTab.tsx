'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OverviewTab({ client, clientId, fetchClientDetails, openEditModal }: any) {


  // Onboarding Form State
  const [newStepName, setNewStepName] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };



  const toggleOnboardingItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/onboarding/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOnboardingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_name: newStepName })
      });
      if (res.ok) {
        setNewStepName('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOnboardingItem = async (itemId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/onboarding/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchClientDetails();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* SOW Scope Tracker Card (Defined / Delivered / Pending) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              🛡️ SOW Scope Tracker (Current Month)
            </h3>
            <p className="text-xs text-slate-500">Tracks Utkarsh's defined SOW contract scope against live team task deliverables.</p>
          </div>
          <Link href="/client/sows" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 transition-colors">
            Manage SOW Contracts &rarr;
          </Link>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">1. Defined Scope</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-950">{client.sow_summary?.total_defined || 0}</span>
              <span className="text-xs text-indigo-700 font-medium">Items Committed</span>
            </div>
            <span className="text-[11px] text-indigo-500 mt-1 block">Set by Utkarsh in SOW contract</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">2. Delivered (Completed)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-950">{client.sow_summary?.total_delivered || 0}</span>
              <span className="text-xs text-emerald-700 font-medium">Tasks Completed</span>
            </div>
            <span className="text-[11px] text-emerald-500 mt-1 block">Completed by team this month</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">3. Pending / Active</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-950">{client.sow_summary?.total_pending || 0}</span>
              <span className="text-xs text-amber-700 font-medium">Tasks In Progress</span>
            </div>
            <span className="text-[11px] text-amber-500 mt-1 block">Pending deliverable tasks</span>
          </div>
        </div>

        {/* Deliverables Breakdown List */}
        {client.sow_summary?.deliverables && client.sow_summary.deliverables.length > 0 ? (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deliverable Quota Breakdown:</h4>
            <div className="space-y-2">
              {client.sow_summary.deliverables.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-sm">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>📌 {item.deliverable_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-slate-600">Defined: <b>{item.defined_qty}</b></span>
                    <span className="text-emerald-700">Delivered: <b>{item.delivered_qty}</b></span>
                    <span className="text-amber-700">Pending: <b>{item.pending_qty}</b></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
          <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 italic">No SOW contract deliverables defined for this client yet.</p>
          </div>
        )}
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Profile & Notes */}
        <div className="space-y-8 lg:col-span-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Profile Details</h3>

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
                  {client.retainer_value ? `₹${client.retainer_value.toLocaleString('en-IN')}/mo` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Services</span>
                <span className="font-medium text-slate-800 block leading-tight">{client.service_type || 'None'}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Core Objective</span>
                <span className="font-medium text-slate-800 italic">{client.objective || 'Not defined yet.'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Focused Area</span>
                <span className="font-medium text-slate-800 italic">{client.focused_area || 'Not defined yet.'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Customer Mindset</span>
                <span className="font-medium text-slate-800 italic">{client.customer_mindset || 'Not defined yet.'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Contacts & Tasks */}
        <div className="space-y-8 lg:col-span-8">


          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Recent Tasks</h3>
              <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">View All Tasks &rarr;</Link>
            </div>
            {client.tasks && client.tasks.length > 0 ? (
              <div className="space-y-2">
                {client.tasks.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">{task.title}</Link>
                    <span className={`px-2 py-0.5 rounded text-xs border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No tasks logged.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Client Onboarding Checklist</h2>
              <p className="text-xs text-slate-500 mt-1">Track key setup milestones required to begin project operations.</p>
            </div>

            <form onSubmit={handleAddOnboardingItem} className="flex space-x-2">
              <input
                type="text"
                placeholder="Add new checklist item (e.g. 'Get Meta Business Manager access')"
                value={newStepName}
                onChange={e => setNewStepName(e.target.value)}
                className="flex-1 text-sm border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button type="submit" className="bg-indigo-600 text-white font-semibold text-xs px-4 rounded hover:bg-indigo-700 transition">Add Item</button>
            </form>

            {client.onboarding_checklist && client.onboarding_checklist.length > 0 ? (
              <div className="space-y-3">
                {client.onboarding_checklist.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggleOnboardingItem(item.id, item.is_completed)}
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-sm ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {item.step_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {item.is_completed && item.completed_at && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-semibold">Done {new Date(item.completed_at).toLocaleDateString()}</span>
                      )}
                      <button onClick={() => handleDeleteOnboardingItem(item.id)} className="text-slate-400 hover:text-rose-600 text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-6">No onboarding checklist items added yet.</p>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
