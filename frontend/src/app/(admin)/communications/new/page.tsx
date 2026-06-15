'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewCommunicationPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    communication_type: 'Call',
    subject: '',
    summary: '',
    next_action: '',
    follow_up_date: ''
  });

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients').then(res => res.json()).then(data => { if(data && data.data) setClients(data.data); });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        window.location.href = '/communications';
      } else {
        alert('Failed to log communication.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/communications" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Communications
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Log Interaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-5 text-sm">
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Client</label>
              <select 
                name="client_id" 
                required 
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                onChange={handleChange}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Type</label>
              <select 
                name="communication_type" 
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                onChange={handleChange}
              >
                <option value="Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meeting">Meeting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Subject</label>
            <input 
              type="text" 
              name="subject" 
              required 
              placeholder="e.g. Discussed Q3 Deliverables"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Summary</label>
            <textarea 
              name="summary" 
              rows={4}
              placeholder="Key discussion points..."
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Next Action</label>
              <input 
                type="text" 
                name="next_action" 
                placeholder="e.g. Send updated proposal"
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Follow Up Date</label>
              <input 
                type="date" 
                name="follow_up_date" 
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/communications" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Save Log
          </button>
        </div>
      </form>
    </div>
  );
}
