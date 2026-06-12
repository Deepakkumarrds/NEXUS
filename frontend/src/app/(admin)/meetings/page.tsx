'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ActionItem = {
  id: string;
  action_item: string;
  status: string;
};

type Meeting = {
  id: string;
  meeting_title: string;
  meeting_date: string;
  attendees: string;
  agenda: string;
  discussion_points: string;
  client?: { company_name: string };
  creator?: { name: string };
  action_items: ActionItem[];
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/meetings')
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
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Minutes of Meeting
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Document discussions and track action items seamlessly.</p>
        </div>
        <Link 
          href="/meetings/new" 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1"
        >
          + Schedule / Log Meeting
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map(meeting => (
            <div 
              key={meeting.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                  {new Date(meeting.meeting_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
                  {meeting.client?.company_name || 'Internal'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">
                {meeting.meeting_title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                <span className="font-semibold text-gray-700">Agenda:</span> {meeting.agenda}
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Attendees</p>
                <p className="text-sm text-gray-700">{meeting.attendees}</p>
              </div>

              <button 
                onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                className="w-full text-left text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex justify-between items-center"
              >
                <span>{meeting.action_items.length} Action Items</span>
                <span>{expandedId === meeting.id ? '↑' : '↓'}</span>
              </button>

              {expandedId === meeting.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {meeting.action_items.length > 0 ? (
                    meeting.action_items.map((item, idx) => (
                      <div key={item.id} className="flex items-start text-sm">
                        <span className="text-indigo-500 mr-2 mt-0.5">•</span>
                        <span className="text-gray-700">{item.action_item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No action items assigned.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!loading && meetings.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className="text-2xl font-bold text-gray-800">No Meetings Logged</h2>
          <p className="text-gray-500 mt-2">Start documenting your client calls and discussions here.</p>
        </div>
      )}
    </div>
  );
}
