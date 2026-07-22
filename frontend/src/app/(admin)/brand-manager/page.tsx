'use client';

import { useState } from 'react';
import BrandStatusTab from './BrandStatusTab';
import DraftSowTab from './DraftSowTab';
import SowResultsTab from './SowResultsTab';

export default function BrandManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'status' | 'draft' | 'results'>('draft');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Brand Manager Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage brand operational statuses, draft new SOWs, and track approval results.</p>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('draft')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'draft'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Draft New SOW
          </button>
          
          <button
            onClick={() => setActiveTab('status')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'status'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Update Brand Status
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'results'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            SOW Results & Approvals
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'draft' && <DraftSowTab />}
        {activeTab === 'status' && <BrandStatusTab />}
        {activeTab === 'results' && <SowResultsTab />}
      </div>
    </div>
  );
}
