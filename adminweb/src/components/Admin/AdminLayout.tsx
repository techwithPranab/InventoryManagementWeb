'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminHeader from '@/components/Admin/AdminHeader';
import AdminFooter from '@/components/Admin/AdminFooter';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import { Menu as MenuIcon } from '@mui/icons-material';

interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdminAuth = async () => {
      // Skip auth check for login page
      if (pathname === '/admin/login') {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/admin/login');
        return;
      }

      try {
        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
          router.push('/login');
          return;
        }
        setIsAuthorized(true);
      } catch {
        router.push('/admin/login');
        return;
      }

      setIsLoading(false);
    };

    checkAdminAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  // For login page, don't show header/footer
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <AdminHeader />

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header for sidebar toggle */}
          <div className="lg:hidden bg-white shadow-sm border-b border-slate-200">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-600 hover:text-slate-900"
                aria-label="Open sidebar"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin Portal</h1>
              </div>
              <div className="w-6" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>

          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
