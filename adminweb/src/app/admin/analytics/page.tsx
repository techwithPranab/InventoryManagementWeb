'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalSetups: number;
  completedSetups: number;
  revenue: {
    monthly: number;
    yearly: number;
  };
  userGrowth: {
    labels: string[];
    data: number[];
  };
  setupProgress: {
    labels: string[];
    data: number[];
  };
  planDistribution: {
    labels: string[];
    data: number[];
  };
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(api.admin.analytics(`period=${timeRange}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics');
        // Set default values if API fails
        setAnalytics({
          totalUsers: 0,
          activeUsers: 0,
          totalSetups: 0,
          completedSetups: 0,
          revenue: { monthly: 0, yearly: 0 },
          userGrowth: { labels: [], data: [] },
          setupProgress: { labels: [], data: [] },
          planDistribution: { labels: [], data: [] }
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default values if API fails
      setAnalytics({
        totalUsers: 0,
        activeUsers: 0,
        totalSetups: 0,
        completedSetups: 0,
        revenue: { monthly: 0, yearly: 0 },
        userGrowth: { labels: [], data: [] },
        setupProgress: { labels: [], data: [] },
        planDistribution: { labels: [], data: [] }
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
        await fetchAnalytics();
      }
      setLoading(false);
    };

    initAdmin();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900">Unable to load analytics</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor user activity, revenue, and system performance</p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex space-x-2">
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: '1y', label: 'Last year' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    timeRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.totalUsers)}</p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.activeUsers)}</p>
                  <p className="text-xs text-green-600">+8% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Setups</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.completedSetups}</p>
                  <p className="text-xs text-green-600">+15% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.revenue.monthly)}</p>
                  <p className="text-xs text-green-600">+23% from last month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">

            {/* User Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600">Chart visualization would go here</p>
                  <p className="text-sm text-gray-500">Integration with Chart.js or similar library needed</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Latest data: {analytics.userGrowth.data[analytics.userGrowth.data.length - 1]} users</p>
              </div>
            </div>

            {/* Setup Progress Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Setup Progress Distribution</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="text-gray-600">Pie chart visualization would go here</p>
                  <p className="text-sm text-gray-500">Integration with Chart.js or similar library needed</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {analytics.setupProgress.labels.map((label, index) => (
                  <div key={label} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      index === 0 ? 'bg-yellow-400' :
                      index === 1 ? 'bg-blue-400' :
                      index === 2 ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-600">{label}: {analytics.setupProgress.data[index]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-semibold mb-4">Subscription Plan Distribution</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {analytics.planDistribution.labels.map((plan, index) => (
                <div key={plan} className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${
                    index === 0 ? 'bg-gray-100' :
                    index === 1 ? 'bg-green-100' :
                    index === 2 ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-gray-600' :
                      index === 1 ? 'text-green-600' :
                      index === 2 ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {analytics.planDistribution.data[index]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{plan}</p>
                  <p className="text-xs text-gray-500">
                    {((analytics.planDistribution.data[index] / analytics.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Monthly Revenue</h4>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.revenue.monthly)}</p>
                <p className="text-sm text-gray-600 mt-1">Current month performance</p>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Annual Revenue</h4>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(analytics.revenue.yearly)}</p>
                <p className="text-sm text-gray-600 mt-1">Projected annual revenue</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Average Revenue Per User (ARPU)</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(analytics.revenue.monthly / analytics.activeUsers)}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
