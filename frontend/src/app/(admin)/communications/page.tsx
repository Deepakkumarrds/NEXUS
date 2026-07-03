'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type WorkRequest = {
  id: string;
  title: string;
  description: string;
  department: string;
  status: string;
  estimated_hours: number | null;
  due_date: string | null;
  created_at: string;
  priority: string;
  tags: string[];
  notes?: string;
  attachment_urls?: string[];
  sow_id?: string;
  requester?: { name: string };
  assignee?: { name: string };
  client?: { company_name: string };
  sow?: { sow_name: string };
};

export default function WorkRequestsPage() {
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Dummy currently logged in user id for acceptance flow
  // In a real app this comes from auth context
  const currentUserId = 'user_id_here'; 

  const fetchRequests = () => {
    const token = localStorage.getItem('token');
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/work-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setRequests(data.data);
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching work requests:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id: string) => {
    const hours = window.prompt("Enter estimated hours for this task:");
    if (!hours || isNaN(parseFloat(hours))) {
      toast.error('Valid estimated hours required to accept.');
      return;
    }
    
    // Hardcode a dummy user ID for the sake of the demo (in reality, it's the logged-in user)
    // We will pass assigned_to in body since we don't have proper auth headers attached yet
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/work-requests/${id}/accept`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estimated_hours: parseFloat(hours), assigned_to: '654321dummyid' }) 
      });
      if (res.ok) {
        toast.success('Request Accepted');
        fetchRequests();
      }
    } catch (err) { console.error(err); }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/work-requests/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`);
        fetchRequests();
      }
    } catch (err) { console.error(err); }
  };

  const deleteRequest = async (id: string) => {
    if(!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com'}/api/work-requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Request deleted');
        fetchRequests();
      }
    } catch (err) { console.error(err); }
  };

  const filteredRequests = requests.filter(req => departmentFilter ? req.department === departmentFilter : true);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Work Requests (Tickets)</h1>
          <p className="text-sm text-slate-500 mt-1">Raise inter-departmental tasks and track their progress.</p>
        </div>
        <Link 
          href="/communications/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Raise Request
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Department</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Departments</option>
            <option value="SEO">SEO</option>
            <option value="Paid Media">Paid Media</option>
            <option value="Social Media">Social Media</option>
            <option value="Web Development">Web Development</option>
            <option value="Design">Design</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading requests...</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ticket Info</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status & Estimation</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRequests.map(req => (
                <tr key={req.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 align-top max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-slate-900">{req.title}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        req.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        req.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        req.priority === 'Low' ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {req.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{req.description}</div>
                    
                    {req.tags && req.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {req.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {req.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 mb-2 italic border-l-2 border-l-slate-300">
                        Notes: {req.notes}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      Requested on: {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 align-top w-48">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                      {req.department}
                    </span>
                  </td>
                  
                  <td className="py-4 px-4 align-top w-64">
                    <div className="mb-2">
                      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium 
                        ${req.status === 'Pending Acceptance' ? 'bg-amber-100 text-amber-800' : 
                          req.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' : 
                          'bg-emerald-100 text-emerald-800'}`}>
                        {req.status}
                      </span>
                    </div>
                    {req.estimated_hours && (
                      <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Est. Time: {req.estimated_hours} hrs
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 align-top w-48 text-right">
                    <div className="flex flex-col items-end justify-start gap-2">
                      {req.status === 'Pending Acceptance' && (
                        <button 
                          onClick={() => handleAccept(req.id)}
                          className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-medium transition"
                        >
                          Accept Ticket
                        </button>
                      )}
                      {req.status === 'Accepted' && (
                        <button 
                          onClick={() => handleStatusUpdate(req.id, 'In Progress')}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium transition"
                        >
                          Start Work
                        </button>
                      )}
                      {req.status === 'In Progress' && (
                        <button 
                          onClick={() => handleStatusUpdate(req.id, 'Completed')}
                          className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium transition"
                        >
                          Mark Completed
                        </button>
                      )}
                      <button 
                        onClick={() => deleteRequest(req.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                    No work requests found. Click "Raise Request" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
