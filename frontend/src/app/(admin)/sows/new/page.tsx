'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AddSowPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    value: '',
    start_date: '',
    end_date: ''
  });
  
  const [sowItems, setSowItems] = useState([{ item_name: '', description: '' }]);

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

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...sowItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSowItems(newItems);
  };

  const addItemRow = () => {
    setSowItems([...sowItems, { item_name: '', description: '' }]);
  };

  const removeItemRow = (index: number) => {
    setSowItems(sowItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sow_items: sowItems.filter(item => item.item_name.trim() !== '')
      };

      const response = await fetch('http://localhost:5000/api/sows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        window.location.href = '/sows';
      } else {
        alert('Failed to create SOW.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-10">
        <Link href="/sows" className="text-teal-600 hover:text-cyan-600 font-bold text-sm transition-colors flex items-center">
          <span className="mr-2">←</span> Back to SOWs
        </Link>
        <h1 className="text-4xl font-black text-gray-900 mt-4 tracking-tight">Create Statement of Work</h1>
        <p className="text-gray-500 mt-2 text-lg font-medium">Define scope, value, and trackable deliverables.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        
        {/* Core SOW Details */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-teal-100 text-teal-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span> 
            Contract Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-2xl border border-gray-100">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">SOW Title</label>
              <input 
                type="text" 
                name="title"
                required
                className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 transition-all outline-none shadow-sm"
                placeholder="e.g. Q4 Marketing Campaign Scope"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Client</label>
              <select 
                name="client_id"
                required
                className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 transition-all outline-none appearance-none shadow-sm"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Total Value (₹ INR)</label>
              <input 
                type="number" 
                name="value"
                required
                className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 transition-all outline-none shadow-sm font-bold text-teal-700"
                placeholder="e.g. 50000"
                value={formData.value}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
              <input 
                type="date" 
                name="start_date"
                required
                className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 transition-all outline-none shadow-sm"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
              <input 
                type="date" 
                name="end_date"
                required
                className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 transition-all outline-none shadow-sm"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* SOW Deliverables */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="bg-cyan-100 text-cyan-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span> 
              Deliverables Tracker
            </h2>
            <button 
              type="button" 
              onClick={addItemRow}
              className="text-sm font-bold text-teal-600 bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-600 hover:text-white transition-colors"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {sowItems.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative group">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Deliverable Name (e.g. Wireframes)"
                    className="w-full bg-gray-50 border-0 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 font-bold mb-2 md:mb-0"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Short description..."
                    className="w-full bg-gray-50 border-0 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none text-gray-600 text-sm"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItemRow(index)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white absolute -right-3 -top-3 shadow-md border border-red-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end items-center pt-8 border-t border-gray-100">
          <Link 
            href="/sows" 
            className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl mr-4 transition"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-12 py-4 rounded-xl font-black shadow-xl shadow-teal-200 transition transform hover:-translate-y-1"
          >
            Create SOW
          </button>
        </div>
      </form>
    </div>
  );
}
