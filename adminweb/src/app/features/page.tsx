import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Features() {
  const features = [
    {
      icon: '📦',
      title: 'Product Management',
      description: 'Complete product catalog management with SKU tracking, categories, and detailed product information.',
      highlights: ['SKU Generation', 'Category Management', 'Product Variants', 'Bulk Import/Export']
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboards and reports to monitor your inventory performance and trends.',
      highlights: ['Live Dashboards', 'Sales Analytics', 'Stock Reports', 'Performance Metrics']
    },
    {
      icon: '🏪',
      title: 'Multi-Warehouse Support',
      description: 'Manage multiple warehouse locations with inter-warehouse transfers and location tracking.',
      highlights: ['Location Management', 'Transfer Tracking', 'Stock Allocation', 'Warehouse Analytics']
    },
    {
      icon: '⚡',
      title: 'Automated Alerts',
      description: 'Smart notifications for low stock, reorder points, and critical inventory events.',
      highlights: ['Low Stock Alerts', 'Reorder Notifications', 'Custom Thresholds', 'Email Integration']
    },
    {
      icon: '🔄',
      title: 'Purchase Orders',
      description: 'Streamlined procurement process with vendor management and automated ordering.',
      highlights: ['Vendor Management', 'Auto Ordering', 'Approval Workflows', 'Order Tracking']
    },
    {
      icon: '📱',
      title: 'Mobile Access',
      description: 'Full mobile compatibility for inventory management on the go with responsive design.',
      highlights: ['Mobile App', 'Barcode Scanning', 'Offline Mode', 'Cloud Sync']
    },
    {
      icon: '🔐',
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with role-based access control and audit trails.',
      highlights: ['Role-based Access', 'Audit Logs', 'Data Encryption', 'GDPR Compliance']
    },
    {
      icon: '🔗',
      title: 'Integrations',
      description: 'Seamless integration with popular e-commerce platforms, accounting software, and APIs.',
      highlights: ['E-commerce Sync', 'Accounting Integration', 'REST API', 'Webhook Support']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Powerful Features for{' '}
              <span className="text-blue-200">Modern Inventory</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Discover how our comprehensive inventory management platform can transform 
              your business operations and boost efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Manage Inventory
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our platform provides all the tools you need to efficiently manage your inventory, 
                from small businesses to enterprise operations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Benefits Section */}
        <div className="bg-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Why Choose Our Inventory System?
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Implementation</h3>
                      <p className="text-gray-600">Get up and running in minutes with our intuitive setup process and pre-configured templates.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Scalable Solution</h3>
                      <p className="text-gray-600">Grows with your business from startup to enterprise with flexible pricing and features.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                      <p className="text-gray-600">Dedicated customer support team available around the clock to help you succeed.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of businesses already using our inventory management system to streamline their operations.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/signup"
                    className="block w-full bg-blue-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full bg-gray-100 text-gray-900 text-center font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Schedule Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
