'use client';

import { useState, useEffect, useRef } from 'react';

const STATUS_COLORS = {
  Offline: 'bg-slate-400',
  Available: 'bg-emerald-500',
  'Tea Break': 'bg-yellow-500',
  'Lunch Break': 'bg-amber-500',
  Meeting: 'bg-rose-500',
};

export default function TrackerDropdown() {
  const [status, setStatus] = useState('Offline');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      const res = await fetch(`${apiUrl}/api/attendance/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.current_status) {
        setStatus(data.current_status);
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleAction = async (actionUrl: string, newStatus?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      
      const body = newStatus ? JSON.stringify({ status: newStatus }) : undefined;
      
      const res = await fetch(`${apiUrl}${actionUrl}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body
      });
      
      const data = await res.json();
      if (res.ok) {
        if (newStatus) setStatus(newStatus);
        else if (actionUrl.includes('punch-in')) setStatus('Available');
        else if (actionUrl.includes('punch-out')) setStatus('Offline');
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  if (loading && status === 'Offline') {
    return <div className="h-10 w-full animate-pulse bg-slate-100 rounded-xl"></div>;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-slate-400'}`}></span>
          <span className="text-sm font-semibold text-slate-700">{status}</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {status === 'Offline' ? (
            <button
              onClick={() => handleAction('/api/attendance/punch-in')}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
              Punch In (Start Work)
            </button>
          ) : (
            <>
              {['Available', 'Tea Break', 'Lunch Break', 'Meeting'].map((s) => (
                status !== s && (
                  <button
                    key={s}
                    onClick={() => handleAction('/api/attendance/status', s)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s as keyof typeof STATUS_COLORS]}`}></span>
                    Switch to {s}
                  </button>
                )
              ))}
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => handleAction('/api/attendance/punch-out')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Punch Out (End Day)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
