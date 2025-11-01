'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Contact, ContactFormData, defaultContact } from '@/models/Contact';

export default function ContactManagement() {
  const [contact, setContact] = useState<Contact>(defaultContact);
  const [formData, setFormData] = useState<ContactFormData>({
    email: '',
    phone: '',
    address: '',
    businessName: '',
    privacyEmail: '',
    legalEmail: '',
    supportEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const fetchContact = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(api.buildUrl(api.backend.contacts), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContact(data);
        setFormData({
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          businessName: data.businessName || '',
          privacyEmail: data.privacyEmail || data.email || '',
          legalEmail: data.legalEmail || data.email || '',
          supportEmail: data.supportEmail || data.email || ''
        });
      } else {
        // Use default contact if none exists
        setFormData({
          email: defaultContact.email,
          phone: defaultContact.phone,
          address: defaultContact.address,
          businessName: defaultContact.businessName,
          privacyEmail: defaultContact.privacyEmail || defaultContact.email,
          legalEmail: defaultContact.legalEmail || defaultContact.email,
          supportEmail: defaultContact.supportEmail || defaultContact.email
        });
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      setError('Failed to load contact information');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(api.buildUrl(api.backend.contacts), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Contact information updated successfully');
        setContact(data.contact);
      } else {
        setError(data.message || 'Failed to update contact information');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initAdmin = async () => {
      const isAuthorized = await checkAdminAuth();
      if (isAuthorized) {
        await fetchContact();
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

  return (
    <div className="bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Information Management</h1>
            <p className="text-gray-600">Manage contact details displayed on legal pages and throughout the platform</p>
          </div>

          {/* Current Contact Info Display */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">Current Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium">{contact.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Primary Email</p>
                <p className="font-medium">{contact.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{contact.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{contact.address}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Edit Contact Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Primary Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                      Support Email
                    </label>
                    <input
                      type="email"
                      id="supportEmail"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="support@company.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty to use primary email</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Business Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="123 Business Street, Suite 100, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <label htmlFor="privacyEmail" className="block text-sm font-medium text-gray-700">
                      Privacy Policy Email
                    </label>
                    <input
                      type="email"
                      id="privacyEmail"
                      name="privacyEmail"
                      value={formData.privacyEmail}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="privacy@company.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty to use primary email</p>
                  </div>

                  <div>
                    <label htmlFor="legalEmail" className="block text-sm font-medium text-gray-700">
                      Legal/Terms Email
                    </label>
                    <input
                      type="email"
                      id="legalEmail"
                      name="legalEmail"
                      value={formData.legalEmail}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="legal@company.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty to use primary email</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
