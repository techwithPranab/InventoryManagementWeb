'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  userId: string;
  email: string;
  role: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <div className="animate-pulse bg-blue-500 h-8 w-20 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">I</span>
            </div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className="hover:text-blue-200 transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className="hover:text-blue-200 transition-colors duration-200"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="hover:text-blue-200 transition-colors duration-200"
            >
              Pricing
            </Link>
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className="hover:text-blue-200 transition-colors duration-200"
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="hover:text-blue-200 transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Authentication Links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  Welcome, <span className="font-semibold">{user.email}</span>
                  {user.role && (
                    <span className="ml-1 px-2 py-1 bg-blue-500 rounded-full text-xs">
                      {user.role}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex space-x-4">
          <Link 
            href="/" 
            className="hover:text-blue-200 transition-colors duration-200"
          >
            Home
          </Link>
          <Link 
            href="/features" 
            className="hover:text-blue-200 transition-colors duration-200"
          >
            Features
          </Link>
          <Link 
            href="/pricing" 
            className="hover:text-blue-200 transition-colors duration-200"
          >
            Pricing
          </Link>
          {user && (
            <>
              <Link 
                href="/dashboard" 
                className="hover:text-blue-200 transition-colors duration-200"
              >
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="hover:text-blue-200 transition-colors duration-200"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
