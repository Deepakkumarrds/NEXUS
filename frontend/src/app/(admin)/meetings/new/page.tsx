'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewMeetingPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    meeting_title: '',
    meeting_date: '',
    attendees: '',
    agenda: '',
    discussion_points: ''
  });
  
  const [actionItems, setActionItems] = useState([{ action_item: '', deadline: '' }]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients').then(res => res.json()).then(data => { if(data && data.data) setClients(data.data); });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleActionItemChange = (index: number, field: string, value: string) => {
    const newItems = [...actionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setActionItems(newItems);
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { action_item: '', deadline: '' }]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        actionItems: actionItems.filter(ai => ai.action_item.trim() !== '') // only send filled ones
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        window.location.href = '/meetings';
      } else {
        alert('Failed to save meeting.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/meetings" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Meetings
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Log Meeting Minutes</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-6 text-sm">
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Meeting Title</label>
              <input 
                type="text" 
                name="meeting_title"
                required
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="e.g. Q3 Strategic Planning"
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

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Date & Time</label>
              <input 
                type="datetime-local" 
                name="meeting_date"
                required
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Attendees</label>
              <input 
                type="text" 
                name="attendees"
                placeholder="e.g. John Doe, Jane Smith"
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Agenda</label>
            <textarea 
              name="agenda"
              rows={3}
              placeholder="What was the purpose of the meeting?"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Discussion Points</label>
            <textarea 
              name="discussion_points"
              required
              rows={5}
              placeholder="Detailed notes and points discussed..."
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Action Items</h3>
              <button 
                type="button" 
                onClick={addActionItem}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
              >
                + Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Describe the task..."
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={item.action_item}
                      onChange={(e) => handleActionItemChange(index, 'action_item', e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={item.deadline}
                      onChange={(e) => handleActionItemChange(index, 'deadline', e.target.value)}
                    />
                  </div>
                  {actionItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeActionItem(index)}
                      className="mt-2 text-slate-400 hover:text-red-600 transition-colors"
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
          <Link href="/meetings" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Save Meeting
          </button>
        </div>
      </form>
    </div>
  );
}
