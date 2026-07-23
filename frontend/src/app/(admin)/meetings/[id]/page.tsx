'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    meeting_title: '',
    meeting_date: '',
    attendees: '',
    recipient_emails: '',
    agenda: '',
    discussion_points: ''
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/clients?activeOnly=true').then(res => res.json()),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + `/api/meetings/${id}`).then(res => res.json())
    ]).then(([clientsData, meetingData]) => {
      if (clientsData && clientsData.data) setClients(clientsData.data);
      if (meetingData && meetingData.data) {
        const d = meetingData.data;
        setFormData({
          client_id: d.client_id || '',
          meeting_title: d.meeting_title || '',
          meeting_date: d.meeting_date ? new Date(d.meeting_date).toISOString().slice(0, 16) : '',
          attendees: d.attendees || '',
          recipient_emails: d.recipient_emails || '',
          agenda: d.agenda || '',
          discussion_points: d.discussion_points || ''
        });
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + `/api/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        router.push('/meetings');
      } else {
        alert('Failed to update meeting.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading meeting...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/meetings" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Meetings
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Edit Meeting Minutes</h1>
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
                value={formData.meeting_title}
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

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Recipient Emails (Whom to Send)</label>
            <input 
              type="text" 
              name="recipient_emails"
              value={formData.recipient_emails}
              placeholder="e.g. gowtham.kt@rdsdigital.in, client@brand.com"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated email addresses where MOM dispatches are sent.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Date & Time</label>
              <input 
                type="datetime-local" 
                name="meeting_date"
                required
                value={formData.meeting_date}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Attendees</label>
              <input 
                type="text" 
                name="attendees"
                value={formData.attendees}
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
              value={formData.agenda}
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
              value={formData.discussion_points}
              placeholder="Detailed notes and points discussed..."
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/meetings" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Update Meeting
          </button>
        </div>
      </form>
    </div>
  );
}
