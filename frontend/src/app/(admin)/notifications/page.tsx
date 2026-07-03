'use client';

import { useEffect, useState } from 'react';

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/notifications');
      const data = await res.json();
      if (data && data.data) {
        setNotifications(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com') + '/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Activity & Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">A timeline of events across your agency.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-md transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading activity stream...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <p className="font-medium text-slate-900">No recent activity</p>
            <p className="text-sm mt-1">You are all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-indigo-50/20' : ''}`}
              >
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!notification.is_read ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                  <span className="text-xs text-slate-400 mt-2 block font-medium">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
