'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PATTokenDialog from '@/components/PATTokenDialog';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  mobileNo?: string;
  industry?: string;
  role: string;
  createdAt: string;
}

interface InventorySetup {
  _id: string;
  ownerName: string;
  email: string;
  industry: string;
  subscriptionPlan: string;
  clientCode: string;
  databaseName: string;
  setupStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  setupCompletedAt?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [inventorySetup, setInventorySetup] = useState<InventorySetup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patDialogOpen, setPATDialogOpen] = useState(false);
  const router = useRouter();

  const getSetupStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchInventorySetup = async (userEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory-setups?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.setups && data.setups.length > 0) {
          setInventorySetup(data.setups[0]); // Get the first setup for this user
        }
      }
    } catch (error) {
      console.error('Error fetching inventory setup:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(api.auth.me, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Fetch inventory setup data for this user
          await fetchInventorySetup(data.user.email);
        } else {
          // Token is invalid, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch {
        // Network error, redirect to login
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your inventory today.
            </p>
          </div>
          
          {/* API Token Button */}
          {inventorySetup && inventorySetup.setupStatus === 'completed' && (
            <button
              onClick={() => setPATDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API Token
            </button>
          )}
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </div>
              <p className="text-gray-900">{user.name}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </div>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Mobile No
              </div>
              <p className="text-gray-900">{user.mobileNo || 'Not provided'}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </div>
              <p className="text-gray-900">{user.industry || 'Not specified'}</p>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </div>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Setup Information */}
        {inventorySetup && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Inventory Setup Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Setup Status
                </div>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                  getSetupStatusColor(inventorySetup.setupStatus)
                }`}>
                  {inventorySetup.setupStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                </div>
                <p className="text-gray-900 font-mono text-sm">{inventorySetup.databaseName}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Client Code
                </div>
                <p className="text-gray-900 font-mono text-sm">{inventorySetup.clientCode}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Login URL
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-blue-600 hover:text-blue-800 underline text-sm">
                    {inventorySetup.setupStatus === 'completed' 
                      ? `http://localhost:3000/login?client=${inventorySetup.clientCode}`
                      : 'Setup not completed yet'
                    }
                  </p>
                  {inventorySetup.setupStatus === 'completed' && (
                    <button
                      onClick={() => {
                        const url = `http://localhost:3000/login?client=${inventorySetup.clientCode}`;
                        navigator.clipboard.writeText(url);
                        // You could add a toast notification here
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan
                </div>
                <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {inventorySetup.subscriptionPlan}
                </span>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Setup Completed
                </div>
                <p className="text-gray-900">
                  {inventorySetup.setupCompletedAt 
                    ? new Date(inventorySetup.setupCompletedAt).toLocaleDateString()
                    : 'Not completed yet'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              More Features Coming Soon!
            </h3>
            <p className="text-gray-600">
              We're working hard to bring you more inventory management features.
              Stay tuned for product management, warehouse tracking, and analytics.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* PAT Token Dialog */}
      {inventorySetup && (
        <PATTokenDialog
          open={patDialogOpen}
          onClose={() => setPATDialogOpen(false)}
          clientCode={inventorySetup.clientCode}
          inventorySetupId={inventorySetup._id}
        />
      )}
    </div>
  );
}
