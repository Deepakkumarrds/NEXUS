'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{name: string, company_name: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    
    if (!token || !userDataStr) {
      router.push('/portal/login');
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      if (userData.role !== 'Client') {
        // If not a client, kick them out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/portal/login');
        return;
      }
      setUser(userData);
      setMounted(true);
    } catch (e) {
      router.push('/portal/login');
    }
  }, [router]);

  if (!mounted || !user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/portal/login');
  };

  const navLinks = [
    { name: 'Dashboard', href: '/client/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Performance Reports', href: '/client/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Contracts & SOWs', href: '/client/sows', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Client Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-indigo-800/50 bg-indigo-950/50">
          <svg className="h-6 w-6 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
          </svg>
          <span className="text-lg font-bold tracking-tight">Client Portal</span>
        </div>
        
        <div className="p-6">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">Welcome back,</p>
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-sm text-indigo-400 truncate">{user.company_name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-800 text-white shadow-sm' 
                    : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path>
                </svg>
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800/50">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-indigo-200 rounded-lg hover:bg-indigo-800/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3 shrink-0 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-sm font-medium text-slate-500">Secure Client Access</h2>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
