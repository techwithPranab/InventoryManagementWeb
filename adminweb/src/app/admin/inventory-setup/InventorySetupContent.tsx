'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  inventorySetup: {
    isCompleted: boolean;
    warehouseCreated: boolean;
    initialProductsAdded: boolean;
    setupCompletedAt?: string;
  };
}

interface InventoryCounts {
  categories: number;
  warehouses: number;
  products: number;
  inventory: number;
}

interface SetupData {
  clientCode: string;
  industry: string;
}

// Generate a unique 8-character client code
function generateClientCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function InventorySetupContent() {
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<InventoryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    clientCode: generateClientCode(),
    industry: 'grocery'
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const fetchUserData = async () => {
    if (!userId) {
      router.push('/admin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Fetch user details from admin web database (internal API)
      const userResponse = await fetch(api.admin.userById(userId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        
        // Fetch inventory status from backend (external API)
        try {
          const countsResponse = await fetch(api.buildUrl(api.backend.inventoryStatus(userId)), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (countsResponse.ok) {
            const countsData = await countsResponse.json();
            setCounts(countsData.counts);
          } else {
            // If backend call fails, set counts to null (user exists but no inventory setup yet)
            setCounts(null);
          }
        } catch (backendError) {
          console.log('Backend not available or inventory not setup yet:', backendError);
          setCounts(null);
        }
      } else {
        console.error('Failed to fetch user data');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/admin');
    }
  };

  const handleSetupInventory = async () => {
    if (!userId) return;

    setSetting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Call backend API to create new database schema and setup inventory
      const response = await fetch(api.buildUrl(api.backend.inventorySetup), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          setupData
        })
      });

      if (response.ok) {
        const backendResult = await response.json();
        const databaseName = backendResult.database;
        
        // Update user record in Admin Web database after successful backend setup
        try {
          const updateResponse = await fetch(api.admin.updateInventorySetup(userId), {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              clientCode: setupData.clientCode,
              industry: setupData.industry,
              databaseName: databaseName
            })
          });

          if (updateResponse.ok) {
            alert(`Inventory database schema setup completed successfully! Database created: ${databaseName} for ${setupData.industry} industry.`);
            
            // Refresh user data from admin web db
            await fetchUserData();
          } else {
            const updateError = await updateResponse.json();
            console.error('Failed to update user record:', updateError);
            alert(`Database setup completed but failed to update user record: ${updateError.error}`);
          }
        } catch (updateError) {
          console.error('Error updating user record:', updateError);
          alert('Database setup completed but failed to update user record');
        }
      } else {
        const error = await response.json();
        alert(`Failed to setup inventory: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting up inventory:', error);
      alert('Failed to setup inventory');
    } finally {
      setSetting(false);
    }
  };

  useEffect(() => {
    const initSetup = async () => {
      await fetchUserData();
      setLoading(false);
    };

    initSetup();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">User not found</h1>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Setup</h1>
            <p className="text-gray-600">Setup initial inventory for {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Admin
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">User Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
          <div>
            <p><strong>Status:</strong> 
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {user.status}
              </span>
            </p>
            <p><strong>Setup Completed:</strong> 
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                user.inventorySetup.isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.inventorySetup.isCompleted ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {counts && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Current Inventory</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{counts.categories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{counts.warehouses}</div>
              <div className="text-sm text-gray-600">Warehouses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{counts.products}</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{counts.inventory}</div>
              <div className="text-sm text-gray-600">Inventory Records</div>
            </div>
          </div>
        </div>
      )}

      {!user.inventorySetup.isCompleted && (
        <div className="space-y-8">
          {/* Client Configuration */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Client Configuration</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="clientCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="clientCode"
                    type="text"
                    value={setupData.clientCode}
                    onChange={(e) => setSetupData({ ...setupData, clientCode: e.target.value.toUpperCase().slice(0, 8) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                    placeholder="AUTO-GENERATED"
                    maxLength={8}
                  />
                  <button
                    onClick={() => setSetupData({ ...setupData, clientCode: generateClientCode() })}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    title="Generate new code"
                  >
                    🔄
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Unique 8-character code for database identification
                </p>
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  id="industry"
                  value={setupData.industry}
                  onChange={(e) => setSetupData({ ...setupData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grocery">Grocery & Retail</option>
                  <option value="electronics">Electronics</option>
                  <option value="pharmaceutical">Pharmaceutical</option>
                  <option value="textile">Textile & Clothing</option>
                  <option value="automotive">Automotive</option>
                  <option value="construction">Construction</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Business industry for optimized setup
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Database Schema Setup</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This will create a new database: <code className="font-mono bg-blue-100 px-1 rounded">inventory_management_{setupData.clientCode}</code> with all necessary collections and schema structure (no default data).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleSetupInventory}
              disabled={setting}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {setting ? 'Setting up...' : 'Complete Database Setup'}
            </button>
          </div>
        </div>
      )}

      {user.inventorySetup.isCompleted && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
          <div className="text-green-600 text-xl font-semibold mb-2">
            ✅ Inventory Setup Completed
          </div>
          <p className="text-green-700">
            Inventory setup was completed on {new Date(user.inventorySetup.setupCompletedAt!).toLocaleDateString()}
          </p>
          <p className="text-sm text-green-600 mt-2">
            User can now access their dashboard and manage their inventory.
          </p>
        </div>
      )}
    </div>
  );
}
