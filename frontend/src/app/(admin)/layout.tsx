'use client';

import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setMounted(true);
    }
  }, [router]);

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
