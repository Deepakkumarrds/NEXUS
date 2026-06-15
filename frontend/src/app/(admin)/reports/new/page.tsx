'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AddReportPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    report_name: '',
    report_type: 'SEO',
    report_month: '',
    file_path: ''
  });

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setClients(data.data); 
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        window.location.href = '/reports';
      } else {
        alert('Failed to upload report.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/reports" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Reports
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Upload Report</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-5 text-sm">
          
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Report Name</label>
            <input 
              type="text" 
              name="report_name"
              required
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="e.g. November SEO Audit"
              value={formData.report_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Client</label>
              <select 
                name="client_id"
                required
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                value={formData.client_id}
                onChange={handleChange}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Report Type</label>
              <select 
                name="report_type"
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                value={formData.report_type}
                onChange={handleChange}
              >
                <option value="SEO">SEO</option>
                <option value="Ads">Ads / Paid Media</option>
                <option value="Social">Social Media</option>
                <option value="Analytics">Analytics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Report Month</label>
            <input 
              type="text" 
              name="report_month"
              required
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="e.g. November 2026"
              value={formData.report_month}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Document Link (Google Drive, Canva, PDF URL)</label>
            <input 
              type="url" 
              name="file_path"
              required
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="https://docs.google.com/..."
              value={formData.file_path || ''}
              onChange={handleChange}
            />
            <p className="text-xs text-slate-500 mt-1">Paste the full URL to the report document.</p>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/reports" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Save Report
          </button>
        </div>
      </form>
    </div>
  );
}
