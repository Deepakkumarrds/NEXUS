'use client';

import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // Always mount after first render to prevent infinite spinner
    setMounted(true);
    
    if (!token) {
      window.location.replace('/login');
    } else {
      let isAdmin = false;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'Admin' || user.role === 'Management') isAdmin = true;
        } catch (e) {}
      }

      const restrictedPaths = ['/communications', '/sows', '/approvals', '/reports', '/intelligence', '/knowledge', '/escalations', '/team', '/settings'];
      const isRestricted = restrictedPaths.some(p => pathname?.startsWith(p));
      
      if (!isAdmin && isRestricted) {
        window.location.replace('/');
      }
    }
  }, [router, pathname]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-300 print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-end px-8 shrink-0 transition-colors duration-300 print:hidden">
          <NotificationBell />
        </header>
        <main className="flex-1 p-8 overflow-y-auto print:overflow-visible print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
