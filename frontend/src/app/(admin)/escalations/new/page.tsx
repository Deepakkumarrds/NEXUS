'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RaiseEscalationPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    issue_description: '',
    severity: 'Medium'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        window.location.href = '/escalations';
      } else {
        alert('Failed to raise escalation.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <Link href="/escalations" className="text-red-600 hover:text-red-800 font-bold text-sm transition-colors flex items-center">
          <span className="mr-2">←</span> Back to Escalations
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">Raise Escalation</h1>
        <p className="text-gray-500 mt-2 text-lg">Flag a high-priority issue for immediate attention.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-red-100">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Issue Title</label>
            <input 
              type="text" 
              name="title"
              required
              className="w-full bg-red-50/30 border-0 ring-1 ring-red-100 rounded-xl p-4 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="e.g. Critical delay in campaign launch"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Client</label>
              <select 
                name="client_id"
                required
                className="w-full bg-red-50/30 border-0 ring-1 ring-red-100 rounded-xl p-4 focus:ring-2 focus:ring-red-500 transition-all outline-none appearance-none"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Severity Level</label>
              <select 
                name="severity"
                className="w-full bg-red-50/30 border-0 ring-1 ring-red-100 rounded-xl p-4 focus:ring-2 focus:ring-red-500 transition-all outline-none appearance-none font-bold text-red-700"
                value={formData.severity}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description</label>
            <textarea 
              name="issue_description"
              required
              rows={5}
              className="w-full bg-red-50/30 border-0 ring-1 ring-red-100 rounded-xl p-4 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="Explain the issue, impact, and expected resolution..."
              value={formData.issue_description}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="mt-10 pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-10 py-3 rounded-xl font-bold shadow-xl shadow-red-200 transition transform hover:-translate-y-1"
          >
            Submit Escalation
          </button>
        </div>
      </form>
    </div>
  );
}
