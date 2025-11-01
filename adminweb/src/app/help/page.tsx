'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { Contact, defaultContact } from '@/models/Contact';

export default function HelpCenter() {
  const [contact, setContact] = useState<Contact>(defaultContact);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch(api.contacts);
        if (response.ok) {
          const data = await response.json();
          setContact(data);
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
        // Keep default contact if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  const helpCategories = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'account-management', title: 'Account Management', icon: '👤' },
    { id: 'inventory-management', title: 'Inventory Management', icon: '📦' },
    { id: 'orders', title: 'Orders & Transactions', icon: '📋' },
    { id: 'reporting', title: 'Reporting & Analytics', icon: '📊' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
    { id: 'billing', title: 'Billing & Subscriptions', icon: '💳' },
    { id: 'security', title: 'Security & Privacy', icon: '🔒' }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create my account?',
        answer: 'To create an account, click the "Sign Up" button on our homepage and fill out the registration form with your business information. You\'ll receive a confirmation email to verify your account.'
      },
      {
        question: 'What are the system requirements?',
        answer: 'Our platform works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend a stable internet connection and a screen resolution of at least 1280x720 for the best experience.'
      },
      {
        question: 'How do I set up my first warehouse?',
        answer: 'After logging in, navigate to the dashboard and click "Setup Warehouse" in the quick actions section. Fill in your warehouse details including name, address, and contact information.'
      },
      {
        question: 'Can I import existing inventory data?',
        answer: 'Yes! We support CSV import for products and inventory. Go to Settings > Import Data and follow the template provided to upload your existing inventory information.'
      }
    ],
    'account-management': [
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings > Account > Change Password. Enter your current password and choose a new secure password. Make sure to use at least 8 characters with a mix of letters, numbers, and symbols.'
      },
      {
        question: 'How do I add team members?',
        answer: 'Admin users can add team members by going to Settings > Team Management > Add User. You can assign different roles (Admin, Manager, Staff) with appropriate permissions.'
      },
      {
        question: 'What are the different user roles?',
        answer: 'Admin: Full system access and user management. Manager: Warehouse and inventory oversight. Staff: Basic inventory operations and order processing.'
      },
      {
        question: 'How do I update my business information?',
        answer: 'Navigate to Settings > Business Profile to update your company details, address, and contact information.'
      }
    ],
    'inventory-management': [
      {
        question: 'How do I add new products?',
        answer: 'Go to Products > Add Product. Fill in product details including name, SKU, description, price, and category. You can also upload product images and set up variants.'
      },
      {
        question: 'What is stock tracking?',
        answer: 'Stock tracking monitors your inventory levels in real-time. Set minimum stock alerts to be notified when products are running low. You can track stock across multiple warehouses.'
      },
      {
        question: 'How do I transfer inventory between warehouses?',
        answer: 'Use the Inventory Transfer feature under Inventory > Transfers. Select the source and destination warehouses, choose products, and specify quantities to move.'
      },
      {
        question: 'How do I set up categories?',
        answer: 'Go to Settings > Categories to create and manage product categories. Categories help organize your products and generate better reports.'
      }
    ],
    'orders': [
      {
        question: 'How do I create a purchase order?',
        answer: 'Navigate to Purchases > New Order. Select a supplier, add products with quantities and prices, and submit the order. You can track order status and receive notifications.'
      },
      {
        question: 'How do I process a sales order?',
        answer: 'Go to Sales > New Order. Select or create a customer, add products from inventory, and process the payment. The system will automatically update inventory levels.'
      },
      {
        question: 'Can I generate invoices?',
        answer: 'Yes! Both purchase and sales orders automatically generate invoices. You can customize invoice templates in Settings > Invoice Settings.'
      },
      {
        question: 'How do I track order status?',
        answer: 'View all orders in the Orders dashboard. Each order shows status (Pending, Processing, Shipped, Delivered) with timestamps and can be filtered by date, status, or customer.'
      }
    ],
    'reporting': [
      {
        question: 'What reports are available?',
        answer: 'Access comprehensive reports including Inventory Summary, Sales Reports, Purchase Reports, Profit & Loss, and Low Stock Alerts from the Reports section.'
      },
      {
        question: 'Can I export reports?',
        answer: 'Yes! All reports can be exported to PDF, Excel, or CSV formats. Set up automated report schedules in Settings > Report Automation.'
      },
      {
        question: 'How do I create custom reports?',
        answer: 'Use the Advanced Analytics dashboard to create custom reports with filters, date ranges, and specific metrics tailored to your business needs.'
      },
      {
        question: 'What is the dashboard overview?',
        answer: 'The main dashboard provides real-time insights including total inventory value, low stock alerts, recent orders, and key performance indicators.'
      }
    ],
    'troubleshooting': [
      {
        question: 'Why can\'t I log in?',
        answer: 'Check your email and password. If you forgot your password, use the "Forgot Password" link. Ensure your account is approved by an admin if you\'re a new user.'
      },
      {
        question: 'The page is loading slowly',
        answer: 'Clear your browser cache and cookies. Check your internet connection. If issues persist, try using a different browser or contact support.'
      },
      {
        question: 'I can\'t save my changes',
        answer: 'Ensure all required fields are filled. Check your internet connection. If you\'re editing existing data, make sure you have the proper permissions.'
      },
      {
        question: 'Data is not updating',
        answer: 'Refresh the page or log out and log back in. Clear your browser cache. If the issue continues, contact our support team.'
      }
    ],
    'billing': [
      {
        question: 'How do I view my billing history?',
        answer: 'Go to Settings > Billing > Payment History to view all your transactions, invoices, and receipts.'
      },
      {
        question: 'How do I update my payment method?',
        answer: 'Navigate to Settings > Billing > Payment Methods. You can add, update, or remove credit cards and other payment options.'
      },
      {
        question: 'Can I change my subscription plan?',
        answer: 'Yes! Go to Settings > Subscription to view available plans and upgrade or downgrade as needed. Changes take effect at the next billing cycle.'
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'Contact our support team to discuss cancellation options. You can also manage your subscription through Settings > Subscription.'
      }
    ],
    'security': [
      {
        question: 'How is my data protected?',
        answer: 'We use industry-standard encryption, secure servers, and regular security audits. All data transmission is encrypted using SSL/TLS protocols.'
      },
      {
        question: 'What is two-factor authentication?',
        answer: '2FA adds an extra layer of security by requiring a code from your phone in addition to your password. Enable it in Settings > Security > Two-Factor Authentication.'
      },
      {
        question: 'How do I report a security concern?',
        answer: 'Contact our security team immediately at our support email. We take security seriously and investigate all reports promptly.'
      },
      {
        question: 'What happens to my data if I delete my account?',
        answer: 'Account deletion removes all your data permanently. We retain minimal information for legal compliance but cannot recover deleted accounts.'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and learn how to make the most of your inventory management system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Help Topics</h3>
              <nav className="space-y-2">
                {helpCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">
                    {helpCategories.find(cat => cat.id === activeCategory)?.icon}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {helpCategories.find(cat => cat.id === activeCategory)?.title}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      Get help with {helpCategories.find(cat => cat.id === activeCategory)?.title.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="px-6 py-8">
                <div className="space-y-4">
                  {faqs[activeCategory as keyof typeof faqs]?.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === `${activeCategory}-${index}` ? null : `${activeCategory}-${index}`)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        <span className={`transform transition-transform ${expandedFAQ === `${activeCategory}-${index}` ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      {expandedFAQ === `${activeCategory}-${index}` && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Support Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Still Need Help?
                </h3>
                <p className="text-gray-600 mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Get help via email - we typically respond within 24 hours
                    </p>
                    <a
                      href={`mailto:${contact.supportEmail || contact.email}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Email Us
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Phone Support</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Speak directly with our support team during business hours
                    </p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      Call Us
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Documentation</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Browse our comprehensive documentation and tutorials
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      View Docs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
