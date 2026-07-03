'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EditCommunicationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    client_id: '',
    communication_type: 'Call',
    subject: '',
    summary: '',
    next_action: '',
    follow_up_date: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + '/api/clients?activeOnly=true').then(res => res.json()),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + '/api/users').then(res => res.json()),
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + `/api/communications/${id}`).then(res => res.json())
    ]).then(([clientsData, usersData, logData]) => {
      if (clientsData && clientsData.data) setClients(clientsData.data);
      if (usersData && usersData.data) setUsers(usersData.data);
      
      if (logData && logData.data) {
        const d = logData.data;
        setFormData({
          client_id: d.client_id || '',
          communication_type: d.communication_type || 'Call',
          subject: d.subject || '',
          summary: d.summary || '',
          next_action: d.next_action || '',
          follow_up_date: d.follow_up_date ? new Date(d.follow_up_date).toISOString().split('T')[0] : ''
        });
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (value: string) => {
    setFormData({ ...formData, summary: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + `/api/communications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        router.push('/communications');
      } else {
        alert('Failed to update communication.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading log...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-6">
        <Link href="/communications" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Communications
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4 tracking-tight">Edit Interaction / MOM</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-6 text-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Type</label>
              <select 
                name="communication_type" 
                value={formData.communication_type}
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
              value={formData.subject}
              placeholder="e.g. Discussed Q3 Deliverables"
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Summary / Minutes of Meeting</label>
            <div className="h-64 mb-12">
              <ReactQuill 
                theme="snow" 
                value={formData.summary} 
                onChange={handleQuillChange} 
                modules={modules}
                style={{ height: '100%' }}
                placeholder="Write minutes, discussion points, decisions made..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 pt-8 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Action Item / Next Step</label>
              <textarea 
                name="next_action" 
                value={formData.next_action}
                placeholder="e.g. Send updated proposal, finalize the contract..."
                rows={3}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-y"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Follow Up Date</label>
              <input 
                type="date" 
                name="follow_up_date" 
                value={formData.follow_up_date}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                onChange={handleChange}
              />
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <Link href="/communications" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
            Update Communication
          </button>
        </div>
      </form>
    </div>
  );
}
