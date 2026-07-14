'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
  Offline: 'bg-slate-400',
  Available: 'bg-emerald-500',
  'Tea Break': 'bg-yellow-500',
  'Lunch Break': 'bg-amber-500',
  Meeting: 'bg-rose-500',
};

export default function TeamAvailabilityWidget() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
        const res = await fetch(`${apiUrl}/api/attendance/team-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.users) {
          setTeam(data.users);
        }
      } catch (err) {
        console.error('Failed to fetch team status', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeam();
    const interval = setInterval(fetchTeam, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
          <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
          <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const activeTeam = team.filter(user => user.current_status !== 'Offline');
  const offlineTeam = team.filter(user => user.current_status === 'Offline');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Team Availability
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {activeTeam.length} Online
          </span>
        </h2>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {activeTeam.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs">
                  {user.name.charAt(0)}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_COLORS[user.current_status as keyof typeof STATUS_COLORS]}`}></span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 text-sm leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1">{user.department}</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
              {user.current_status}
            </span>
          </div>
        ))}
        
        {offlineTeam.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 mb-2 px-1 uppercase tracking-wider">Offline</p>
            {offlineTeam.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-600 text-xs">{user.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {team.length === 0 && (
          <p className="text-sm text-slate-500 italic text-center p-4">No team members found.</p>
        )}
      </div>
    </div>
  );
}
