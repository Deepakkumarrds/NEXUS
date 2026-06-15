'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewSowPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    sow_name: '',
    start_date: '',
    end_date: '',
    total_value: ''
  });
  
  const [sowItems, setSowItems] = useState([{ deliverable_name: '' }]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients').then(res => res.json()).then(data => { if(data && data.data) setClients(data.data); });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...sowItems];
    newItems[index].deliverable_name = value;
    setSowItems(newItems);
  };

  const addItem = () => {
    setSowItems([...sowItems, { deliverable_name: '' }]);
  };

  const removeItem = (index: number) => {
    setSowItems(sowItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        items: sowItems.filter(i => i.deliverable_name.trim() !== '')
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/sows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        window.location.href = '/sows';
      } else {
        alert('Failed to save SOW.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/sows" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to SOWs
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Draft New SOW</h1>
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
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="e.g. 500000"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Project Deliverables</h3>
                <p className="text-xs text-slate-500 mt-1">List the individual services or milestones tied to this SOW.</p>
              </div>
              <button 
                type="button" 
                onClick={addItem}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
              >
                + Add Deliverable
              </button>
            </div>
            
            <div className="space-y-3">
              {sowItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-center bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder={`Deliverable ${index + 1}`}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={item.deliverable_name}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                    />
                  </div>
                  {sowItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/sows" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Save Contract
          </button>
        </div>
      </form>
    </div>
  );
}
