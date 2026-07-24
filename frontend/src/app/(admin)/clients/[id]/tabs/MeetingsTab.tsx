'use client';
import { useEffect, useState } from 'react';

export default function MeetingsTab({ client }: any) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client?.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/meetings?client_id=${client.id}`)
        .then(res => res.json())
        .then(data => {
          const clientMeetings = data.data ? data.data.filter((m: any) => m.client_id === client.id) : [];
          setMeetings(clientMeetings);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [client]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-900 text-lg">Meetings</h3>
        <p className="text-xs text-slate-500 mt-1">Manage and view meetings for this client.</p>
      </div>

      {loading ? (
         <div className="text-center py-8 text-slate-500 text-sm">Loading meetings...</div>
      ) : meetings.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {meetings.map((meeting, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-slate-800 text-sm">{meeting.meeting_title || 'Untitled Meeting'}</h4>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${meeting.is_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {meeting.is_sent ? 'Sent' : 'Draft/Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(meeting.meeting_date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                {' '}at{' '}
                {new Date(meeting.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {meeting.agenda && (
                <div className="text-xs text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: meeting.agenda }}></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 italic">No meetings scheduled yet.</p>
        </div>
      )}
    </div>
  );
}
