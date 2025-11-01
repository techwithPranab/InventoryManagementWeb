import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Inventory Management{' '}
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Streamline your inventory operations with our comprehensive management system.
            Track products, manage warehouses, and optimize your supply chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Product Management</h3>
            <p className="text-gray-600">
              Organize and track your products with detailed information, categories, and pricing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-gray-600">
              Get insights into your inventory with real-time dashboards and comprehensive reports.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Enterprise-grade security with role-based access control and data protection.
            </p>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Don't just take our word for it. Here's what businesses are saying about our inventory management system.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Inventory Pro has transformed our warehouse operations. We've reduced stockouts by 60%
                  and improved our inventory accuracy to 99.5%. The real-time analytics are game-changing."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">SJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Operations Manager, TechCorp</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The ease of use and comprehensive features make Inventory Pro perfect for our growing business.
                  Customer support is exceptional, and the mobile app keeps us connected on the go."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold">MC</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Michael Chen</p>
                    <p className="text-sm text-gray-600">CEO, RetailPlus</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Since implementing Inventory Pro, our supply chain efficiency has improved dramatically.
                  The automated reorder system and detailed reporting have saved us countless hours."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">ER</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Emily Rodriguez</p>
                    <p className="text-sm text-gray-600">Supply Chain Director, GlobalTrade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Partners Section */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join thousands of businesses worldwide that trust Inventory Pro for their inventory management needs.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">TechCorp</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🏪</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">RetailPlus</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">GlobalTrade</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🏭</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">Manufacturing Inc</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">Logistics Pro</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">E-Commerce Hub</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-6">
            Join thousands of businesses already using our inventory management system.
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Create Free Account
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
