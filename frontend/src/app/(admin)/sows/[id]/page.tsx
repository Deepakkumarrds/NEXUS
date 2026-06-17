'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditSowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    sow_name: '',
    start_date: '',
    end_date: '',
    total_value: ''
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients?activeOnly=true').then(res => res.json()),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/sows/${id}`).then(res => res.json())
    ]).then(([clientsData, sowData]) => {
      if (clientsData && clientsData.data) setClients(clientsData.data);
      if (sowData && sowData.data) {
        const d = sowData.data;
        setFormData({
          client_id: d.client_id || '',
          sow_name: d.sow_name || '',
          start_date: d.start_date ? new Date(d.start_date).toISOString().split('T')[0] : '',
          end_date: d.end_date ? new Date(d.end_date).toISOString().split('T')[0] : '',
          total_value: d.total_value?.toString() || ''
        });
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/sows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        router.push('/sows');
      } else {
        alert('Failed to update SOW.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading SOW...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/sows" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to SOWs
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Edit SOW</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-6 text-sm">
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">SOW Title</label>
              <input 
                type="text" 
                name="sow_name"
                required
                value={formData.sow_name}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="e.g. 2026 Marketing Retainer"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Client</label>
              <select 
                name="client_id"
                required
                value={formData.client_id}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                onChange={handleChange}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Start Date</label>
              <input 
                type="date" 
                name="start_date"
                required
                value={formData.start_date}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">End Date</label>
              <input 
                type="date" 
                name="end_date"
                required
                value={formData.end_date}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Total Value (₹)</label>
              <input 
                type="number" 
                name="total_value"
                required
                value={formData.total_value}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="e.g. 500000"
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/sows" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Update Contract
          </button>
        </div>
      </form>
    </div>
  );
}
