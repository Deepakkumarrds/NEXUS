'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AddReportPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    report_name: '',
    report_type: 'SEO',
    report_month: ''
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/clients')
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
      const response = await fetch('http://localhost:5000/api/reports', {
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
      <div className="mb-10">
        <Link href="/reports" className="text-blue-600 hover:text-indigo-600 font-bold text-sm transition-colors flex items-center">
          <span className="mr-2">←</span> Back to Reports
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">Upload Report</h1>
        <p className="text-gray-500 mt-2 text-lg">Log a new client deliverable into the system.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Report Name</label>
            <input 
              type="text" 
              name="report_name"
              required
              className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              placeholder="e.g. November SEO Audit"
              value={formData.report_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Client</label>
              <select 
                name="client_id"
                required
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
              <select 
                name="report_type"
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
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
            <label className="block text-sm font-bold text-gray-700 mb-2">Report Month (e.g. "November 2026")</label>
            <input 
              type="text" 
              name="report_month"
              required
              className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              placeholder="Month Year"
              value={formData.report_month}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="mt-10 pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3 rounded-xl font-bold shadow-xl shadow-blue-200 transition transform hover:-translate-y-1"
          >
            Save Report
          </button>
        </div>
      </form>
    </div>
  );
}
