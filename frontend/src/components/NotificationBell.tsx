'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/mixkit-bell-notification-933.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error('Audio play failed:', e));
    }
  };

  const fetchNotifications = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
      const res = await fetch(`${baseUrl}/api/notifications`);
      if (!res || !res.ok) return;
      const data = await res.json();
      if (data && data.data) {
        setNotifications(data.data);
      }
    } catch (error) {
      // Gracefully handle backend sleep / temporary offline states without throwing
    }
  };


  const markAllAsRead = async () => {
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Setup Socket.io for Real-Time notifications
  useEffect(() => {
    fetchNotifications();

    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        userId = JSON.parse(userStr).id;
      } catch (e) {}
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com';
    const socket = io(apiUrl);

    if (userId) {
      socket.emit('join_user_room', userId);
    }

    socket.on('new_notification', (newNotif: Notification) => {
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      playNotificationSound();
    });

    return () => {
      socket.disconnect();
    };
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
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        !notification.is_read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                        !notification.is_read ? 'bg-indigo-500' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(notification.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>
            
              <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); playNotificationSound(); }}
                  className="w-full mr-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  Test Sound
                </button>
                <button
                  onClick={markAllAsRead}
                  className="w-full py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
