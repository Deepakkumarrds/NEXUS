'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewTaskPage() {
  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayWarning, setHolidayWarning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: '',
    is_recurring: false,
    recurrence_pattern: 'Weekly',
    recurrence_end: ''
  });

  useEffect(() => {
    // Fetch Clients
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients')
      .then(res => res.json())
      .then(data => { if(data && data.data) setClients(data.data); });

    // Fetch Users (for assignment and skill tags)
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users')
      .then(res => res.json())
      .then(data => { if(data && data.data) setUsers(data.data); });

    // Fetch Holidays (for holiday-aware warning checks)
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/holidays')
      .then(res => res.json())
      .then(data => { if(data && data.data) setHolidays(data.data); });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Perform Holiday check if due_date is changed
      if (name === 'due_date') {
        checkHoliday(value);
      }
    }
  };

  const checkHoliday = (selectedDateStr: string) => {
    if (!selectedDateStr) {
      setHolidayWarning(null);
      return;
    }
    const selectedDate = new Date(selectedDateStr).toISOString().split('T')[0];
    const match = holidays.find(h => new Date(h.holiday_date).toISOString().split('T')[0] === selectedDate);
    
    if (match) {
      setHolidayWarning(`⚠️ Scheduled date coincides with public holiday: ${match.holiday_name}`);
    } else {
      setHolidayWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Task created successfully!');
        window.location.href = '/tasks';
      } else {
        alert('Failed to save task.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/tasks" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Tasks
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Create Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-5 text-sm">
          
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Task Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Client</label>
            <select 
              name="client_id" 
              required 
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            >
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Assignee (Skill-Based Tagging)</label>
            <select 
              name="assigned_to" 
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
              value={formData.assigned_to}
            >
              <option value="">Select an assignee...</option>
              {users.map(u => {
                const skillsStr = u.skills && u.skills.length > 0 ? ` [${u.skills.join(', ')}]` : ' [No skills listed]';
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.designation || 'Staff'}){skillsStr}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Description</label>
            <textarea 
              name="description" 
              rows={4}
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Priority</label>
              <select 
                name="priority" 
                style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Due Date</label>
              <input 
                type="date" 
                name="due_date" 
                style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
              {holidayWarning && (
                <p className="text-xs text-amber-600 font-bold mt-1.5">{holidayWarning}</p>
              )}
            </div>
          </div>

          {/* Recurrence Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="is_recurring" 
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleChange}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="is_recurring" className="font-semibold text-slate-700 cursor-pointer">Make this a Recurring Task (Social Calendar Scheduler)</label>
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Recurrence Pattern</label>
                  <select name="recurrence_pattern" value={formData.recurrence_pattern} onChange={handleChange} style={{ color: '#0f172a', backgroundColor: '#ffffff' }} className="w-full text-xs border border-slate-300 rounded p-2 outline-none">
                    <option value="Weekly">Weekly (Every Monday)</option>
                    <option value="Monthly">Monthly (1st of Month)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Recurrence Date</label>
                  <input type="date" name="recurrence_end" value={formData.recurrence_end} onChange={handleChange} style={{ color: '#0f172a', backgroundColor: '#ffffff' }} className="w-full text-xs border border-slate-300 rounded p-2 outline-none" />
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/tasks" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}
