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
    
    if (!token) {
      router.push('/login');
    } else {
      let isAdmin = false;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'Admin') isAdmin = true;
        } catch (e) {}
      }

      // Restricted paths that only Admins should access
      const restrictedPaths = ['/communications', '/meetings', '/sows', '/approvals', '/reports', '/intelligence', '/knowledge', '/escalations', '/team', '/settings'];
      
      const isRestricted = restrictedPaths.some(p => pathname?.startsWith(p));
      
      if (!isAdmin && isRestricted) {
        router.push('/'); // Redirect to dashboard if unauthorized
      } else {
        setMounted(true);
      }
    }
  }, [router, pathname]);

  if (!mounted) return null;

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
