'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClientDetails = () => {
    fetch(`http://localhost:5000/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setClient(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  if (loading) return <div className="text-slate-500">Loading client profile...</div>;
  if (!client) return <div className="text-rose-500">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Clients
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{client.company_name}</h1>
          <p className="text-sm text-slate-500 mt-1">{client.service_type} • Since {new Date(client.created_at).getFullYear()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Contacts */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Profile Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Primary Email</span>
                <span className="font-medium text-slate-800">{client.email}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Retainer Value</span>
                <span className="font-medium text-slate-800">{client.retainer_value ? `₹${client.retainer_value.toLocaleString('en-IN')}` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Contacts Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Client Contacts</h3>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add</button>
            </div>
            {client.contacts && client.contacts.length > 0 ? (
              <ul className="space-y-3">
                {client.contacts.map((contact: any) => (
                  <li key={contact.id} className="text-sm">
                    <p className="font-medium text-slate-800 flex items-center">
                      {contact.contact_name} 
                      {contact.is_primary && <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">PRIMARY</span>}
                    </p>
                    <p className="text-slate-500 text-xs">{contact.title}</p>
                    <p className="text-slate-500 text-xs">{contact.email}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No contacts added yet.</p>
            )}
          </div>

          {/* SPOCs Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-900">Internal SPOCs</h3>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Assign</button>
            </div>
            {client.spocs && client.spocs.length > 0 ? (
              <ul className="space-y-3">
                {client.spocs.map((spoc: any) => (
                  <li key={spoc.id} className="text-sm">
                    <p className="font-medium text-slate-800">User ID: {spoc.user_id}</p>
                    <p className="text-slate-500 text-xs">{spoc.responsibility}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No internal SPOCs assigned.</p>
            )}
          </div>
        </div>

        {/* Right Column: Related Data */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Recent Tasks */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Recent Tasks</h3>
            {client.tasks && client.tasks.length > 0 ? (
              <div className="space-y-2">
                {client.tasks.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                    <span className="font-medium text-slate-800">{task.task_name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No tasks for this client.</p>
            )}
          </div>

          {/* Active SOWs */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Active SOWs</h3>
            {client.sows && client.sows.length > 0 ? (
              <div className="space-y-2">
                {client.sows.map((sow: any) => (
                  <div key={sow.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                    <span className="font-medium text-slate-800">{sow.sow_name}</span>
                    <span className="text-slate-600">{sow.total_value ? `₹${sow.total_value.toLocaleString('en-IN')}` : '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No SOWs drafted.</p>
            )}
          </div>

          {/* Recent Meetings */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Recent Meetings</h3>
            {client.meetings && client.meetings.length > 0 ? (
              <div className="space-y-2">
                {client.meetings.map((meeting: any) => (
                  <div key={meeting.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                    <span className="font-medium text-slate-800">{meeting.meeting_title}</span>
                    <span className="text-slate-500 text-xs">{new Date(meeting.meeting_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No meetings logged.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
