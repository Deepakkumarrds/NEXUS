'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const now = useLiveClock();

  const fetchNotifications = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + '/api/notifications');
      const data = await res.json();
      if (data && data.data) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + '/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  return (
    <div className="flex items-center gap-4">
      {/* Live Date & Time */}
      <div className="hidden sm:flex flex-col items-end leading-tight select-none">
        <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
          {dateStr}
        </span>
        <span className="text-sm font-bold text-slate-800 tabular-nums">
          {timeStr}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-200" />

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    You're all caught up!
                  </div>
                ) : (
                  notifications.slice(0, 5).map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-slate-800">{notification.title}</span>
                        {!notification.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  View all activity
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
