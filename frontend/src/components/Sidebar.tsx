'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import TrackerDropdown from './TrackerDropdown';

export default function Sidebar() {
  const pathname = usePathname() || '';
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // authController returns role as a string, e.g., 'Admin'
        if (user.role === 'Admin') {
          setIsAdmin(true);
        }
      } catch (e) {}
    }
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };



  return (
    <aside className="w-64 bg-white text-slate-700 h-screen sticky top-0 p-5 flex flex-col border-r border-slate-200/85">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-heading">Nexus</h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Client Management</p>
      </div>

      <div className="mb-6">
        <TrackerDropdown />
      </div>
      
      <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-1 text-sm font-medium">
          <li>
            <Link 
              href="/" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/clients" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/clients') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/clients') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Clients Master
            </Link>
          </li>
          <li>
            <Link 
              href="/tasks" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/tasks') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/tasks') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              Tasks
            </Link>
          </li>
          {isAdmin && (
            <>
              <li>
                <Link 
                  href="/communications" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/communications') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/communications') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Communications
                </Link>
              </li>
              <li>
                <Link 
                  href="/meetings" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/meetings') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/meetings') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Meetings
                </Link>
              </li>

              <li>
                <Link 
                  href="/activity" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/activity') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/activity') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Client Activity
                </Link>
              </li>
              <li>
                <Link 
                  href="/approvals" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/approvals') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/approvals') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Approvals
                </Link>
              </li>
              <li>
                <Link 
                  href="/reports" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/reports') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/reports') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Reports
                </Link>
              </li>
            </>
          )}

          <li>
            <Link 
              href="/tracker" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/tracker') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/tracker') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Daily Tracker
            </Link>
          </li>
          <li>
            <Link 
              href="/attendance" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/attendance') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/attendance') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              My Attendance
            </Link>
          </li>
          <li>
            <Link 
              href="/leaves" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/leaves') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/leaves') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Leave Tracker
            </Link>
          </li>

          {isAdmin && (
            <>
              {/* Intelligence Section */}
              <li className="pt-4 mt-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Intelligence</p>
              </li>
              <li>
                <Link 
                  href="/intelligence" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/intelligence') 
                      ? 'bg-violet-50/70 text-violet-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/intelligence') ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Intelligence Hub
                </Link>
              </li>
              <li>
                <Link 
                  href="/knowledge" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/knowledge') 
                      ? 'bg-violet-50/70 text-violet-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/knowledge') ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Knowledge Base
                </Link>
              </li>
              
              <li className="pt-4 mt-4 border-t border-slate-100">
                <Link 
                  href="/escalations" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/escalations') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/escalations') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Escalations
                </Link>
              </li>
            </>
          )}
          <li>
            <Link 
              href="/notifications" 
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                isActive('/notifications') 
                  ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/notifications') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Alerts
            </Link>
          </li>
          {isAdmin && (
            <>
              <li>
                <Link 
                  href="/team" 
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 outline-none group ${
                    isActive('/team') 
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className={`w-4 h-4 mr-3 transition-colors ${isActive('/team') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Team Directory
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      


      <div className="mt-auto border-t border-slate-100 pt-5">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
