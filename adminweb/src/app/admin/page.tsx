'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DashboardStats {
  users: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  inventory: {
    totalSetups: number;
    completedSetups: number;
    inProgressSetups: number;
    failedSetups: number;
  };
  revenue: {
    monthly: number;
    yearly: number;
  };
  system: {
    activeUsers: number;
    totalRevenue: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(api.admin.dashboard, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
        // Set default values if API fails
        setStats({
          users: { total: 0, pending: 0, approved: 0, rejected: 0 },
          inventory: { totalSetups: 0, completedSetups: 0, inProgressSetups: 0, failedSetups: 0 },
          revenue: { monthly: 0, yearly: 0 },
          system: { activeUsers: 0, totalRevenue: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values if API fails
      setStats({
        users: { total: 0, pending: 0, approved: 0, rejected: 0 },
        inventory: { totalSetups: 0, completedSetups: 0, inProgressSetups: 0, failedSetups: 0 },
        revenue: { monthly: 0, yearly: 0 },
        system: { activeUsers: 0, totalRevenue: 0 }
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  useEffect(() => {
    const initAdmin = async () => {
      const isAuthorized = await checkAdminAuth();
      if (isAuthorized) {
        await fetchDashboardStats();
      }
      setLoading(false);
    };

    initAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900">Unable to load dashboard</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of system performance and management areas</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">User Management</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.users.pending} pending</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/inventory" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inventory Setup</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.inventory.completedSetups} completed</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/analytics" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Analytics</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.revenue.monthly)}</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/subscriptions" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.users.approved} active</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.users.total)}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.system.activeUsers)}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600">+8% from last month</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.revenue.monthly)}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600">+23% from last month</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Setup Completion</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round((stats.inventory.completedSetups / stats.inventory.totalSetups) * 100)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-600">{stats.inventory.completedSetups} of {stats.inventory.totalSetups} completed</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">User Status Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Pending Approval</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.users.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Approved Users</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.users.approved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Rejected Users</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.users.rejected}</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all users →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Inventory Setup Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">In Progress</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.inventory.inProgressSetups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.inventory.completedSetups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Failed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.inventory.failedSetups}</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/admin/inventory"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View inventory setups →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
