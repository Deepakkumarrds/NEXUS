'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AddMeetingPage() {
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

  const handleActionItemChange = (index: number, field: string, value: string) => {
    const newItems = [...actionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setActionItems(newItems);
  };

  const addActionItemRow = () => {
    setActionItems([...actionItems, { action_item: '', deadline: '' }]);
  };

  const removeActionItemRow = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        action_items: actionItems.filter(item => item.action_item.trim() !== '')
      };

      const response = await fetch('http://localhost:5000/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        window.location.href = '/meetings';
      } else {
        alert('Failed to log meeting.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <Link href="/meetings" className="text-indigo-600 hover:text-purple-600 font-semibold text-sm transition-colors flex items-center">
          <span className="mr-2">←</span> Back to Meetings
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-800 mt-4 tracking-tight">Log New Meeting</h1>
        <p className="text-gray-500 mt-2 text-lg">Record discussions and assign action items seamlessly.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50">
        
        {/* Basic Info Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Meeting Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Title</label>
              <input 
                type="text" 
                name="meeting_title"
                required
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner"
                placeholder="e.g. Q3 Performance Review"
                value={formData.meeting_title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Client</label>
              <select 
                name="client_id"
                required
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Date</label>
              <input 
                type="datetime-local" 
                name="meeting_date"
                required
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={formData.meeting_date}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Attendees (Names / Roles)</label>
              <input 
                type="text" 
                name="attendees"
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner"
                placeholder="e.g. John Doe (CEO), Sarah Smith (Marketing Lead)"
                value={formData.attendees}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Agenda</label>
              <input 
                type="text" 
                name="agenda"
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="Core topics planned for discussion"
                value={formData.agenda}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Discussion Points (MOM)</label>
              <textarea 
                name="discussion_points"
                rows={5}
                required
                className="w-full bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner resize-y"
                placeholder="Record the exact minutes and takeaways here..."
                value={formData.discussion_points}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Action Items Section */}
        <div className="mb-10 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-indigo-900">Action Items</h2>
            <button 
              type="button" 
              onClick={addActionItemRow}
              className="text-sm font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white transition-colors"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {actionItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100 relative group">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Describe the task/action..."
                    className="w-full bg-transparent border-0 p-2 focus:ring-0 outline-none text-gray-800"
                    value={item.action_item}
                    onChange={(e) => handleActionItemChange(index, 'action_item', e.target.value)}
                  />
                </div>
                <div className="w-48 border-l pl-4">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 text-sm text-gray-500 focus:ring-0 outline-none"
                    value={item.deadline}
                    onChange={(e) => handleActionItemChange(index, 'deadline', e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeActionItemRow(index)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white absolute -right-3 -top-3 shadow-sm border border-red-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t border-gray-100">
          <Link 
            href="/meetings" 
            className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl mr-4 transition"
          >
            Discard
          </Link>
          <button 
            type="submit" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-3 rounded-xl font-bold shadow-xl shadow-indigo-200 transition transform hover:-translate-y-0.5"
          >
            Save Meeting Log
          </button>
        </div>
      </form>
    </div>
  );
}
