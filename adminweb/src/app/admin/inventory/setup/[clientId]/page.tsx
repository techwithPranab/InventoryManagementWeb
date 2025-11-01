'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InventorySetupWizard from '@/components/Setup/InventorySetupWizard';

interface PageProps {
  params: {
    clientId: string;
  };
}

export default function InventorySetupPage({ params }: PageProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/admin/login');
      return false;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return false;
      }
      return true;
    } catch {
      router.push('/admin/login');
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const authorized = await checkAdminAuth();
      setIsAuthorized(authorized);
      setLoading(false);
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in checkAdminAuth
  }

  return <InventorySetupWizard />;
}
