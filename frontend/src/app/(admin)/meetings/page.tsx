'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ActionItem = {
  id: string;
  action_item: string;
  status: string;
  deadline: string | null;
};

type Meeting = {
  id: string;
  meeting_title: string;
  meeting_date: string;
  attendees: string;
  agenda: string;
  discussion_points: string;
  created_at: string;
  client?: { company_name: string };
  action_items?: ActionItem[];
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setMeetings(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching meetings:', error);
        setLoading(false);
      });
    fetchMeetings();
  }, []);

  const fetchMeetings = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/meetings')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setMeetings(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching meetings:', error);
        setLoading(false);
      });
  };

  const deleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/meetings/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchMeetings();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Minutes of Meeting</h1>
          <p className="text-sm text-slate-500 mt-1">Record meeting minutes and track assigned action items.</p>
        </div>
        <Link 
          href="/meetings/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Log Meeting
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">Loading data...</div>
      ) : (
        <div className="space-y-4">
          {meetings.map(meeting => (
            <div key={meeting.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div 
                className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{meeting.meeting_title}</h3>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200 font-medium">
                        {meeting.client?.company_name || 'Internal'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 space-x-4 mt-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {meeting.attendees}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Link 
                      href={`/meetings/${meeting.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition"
                      title="Edit Meeting"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </Link>
                    <button 
                      onClick={(e) => deleteMeeting(meeting.id, e)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                      title="Delete Meeting"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <svg className={`w-5 h-5 ml-2 transform transition-transform ${expandedId === meeting.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {expandedId === meeting.id && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 uppercase tracking-wider text-xs">Agenda</h4>
                      <p className="text-slate-600 bg-white p-3 rounded border border-slate-200">{meeting.agenda || 'No agenda provided'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 uppercase tracking-wider text-xs">Discussion Points</h4>
                      <p className="text-slate-600 bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">{meeting.discussion_points || 'No discussion points recorded'}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-slate-700 mb-3 uppercase tracking-wider text-xs">Action Items ({meeting.action_items?.length || 0})</h4>
                    {meeting.action_items && meeting.action_items.length > 0 ? (
                      <ul className="space-y-2">
                        {meeting.action_items.map(item => (
                          <li key={item.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                            <div className="flex items-center flex-1">
                              <input 
                                type="checkbox" 
                                checked={item.status === 'Completed'}
                                onChange={async (e) => {
                                  const newStatus = e.target.checked ? 'Completed' : 'Pending';
                                  try {
                                    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + `/api/meetings/action-items/${item.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                    });
                                    if (res.ok) {
                                      setMeetings(meetings.map(m => {
                                        if (m.id === meeting.id) {
                                          return {
                                            ...m,
                                            action_items: m.action_items?.map(ai => ai.id === item.id ? { ...ai, status: newStatus } : ai)
                                          };
                                        }
                                        return m;
                                      }));
                                    }
                                  } catch (err) {
                                    console.error('Failed to update status', err);
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-3 cursor-pointer" 
                              />
                              <span className={`text-sm ${item.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                {item.action_item}
                              </span>
                            </div>
                            <span className={`text-xs font-medium border px-2 py-1 rounded ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                              Due: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No action items assigned.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!loading && meetings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">No Meetings Logged</h2>
              <p className="text-slate-500 mt-1 text-sm">Click "Log Meeting" to add your first MOM.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
