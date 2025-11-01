'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { Contact, defaultContact } from '@/models/Contact';

export default function CookiePolicy() {
  const [contact, setContact] = useState<Contact>(defaultContact);
  const [loading, setLoading] = useState(true);

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Cookie Policy
            </h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> November 1, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better browsing experience by remembering your preferences and understanding how you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                  <li><strong>Authentication Cookies:</strong> Keep you logged in during your session</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our platform</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Strictly Necessary Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies are essential for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Performance Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Functional Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.4 Targeting Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  In some cases, we use third-party services that may set their own cookies. We have no control over these cookies, and they are subject to the respective third party's privacy policy. Examples include:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>Google Analytics (for website analytics)</li>
                  <li>Payment processors (for secure transactions)</li>
                  <li>Social media platforms (for social sharing features)</li>
                  <li>Customer support tools</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookie Duration</h2>
                <p className="text-gray-700 mb-4">
                  Cookies can be classified by their duration:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or until you delete them</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Managing Cookies</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Browser Settings</h3>
                <p className="text-gray-700 mb-4">
                  You can control and manage cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete all cookies or specific cookies</li>
                  <li>Block cookies from specific sites</li>
                  <li>Block all cookies from being placed</li>
                  <li>Clear cookies when you close your browser</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Cookie Consent</h3>
                <p className="text-gray-700 mb-4">
                  When you first visit our website, you will be presented with a cookie banner where you can choose which types of cookies you wish to accept. You can change your preferences at any time by clicking the cookie settings link in our website footer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Impact of Disabling Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Please note that disabling certain cookies may affect the functionality of our website. For example:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>You may not be able to stay logged in</li>
                  <li>Some features may not work properly</li>
                  <li>Your preferences may not be remembered</li>
                  <li>You may see less relevant content or advertisements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><strong>Email:</strong> {contact.privacyEmail || contact.email}</p>
                  <p className="text-gray-700"><strong>Phone:</strong> {contact.phone}</p>
                  <p className="text-gray-700"><strong>Address:</strong> {contact.address}</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookie List</h2>
                <p className="text-gray-700 mb-4">
                  Below is a list of the main cookies we use on our website:
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Cookie Name</th>
                        <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Purpose</th>
                        <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">session_token</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">User authentication</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Essential</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Session</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">_ga</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Google Analytics</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Analytics</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">2 years</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">theme_preference</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">User interface preferences</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Functional</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">1 year</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">cart_items</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Shopping cart contents</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">Functional</td>
                        <td className="px-4 py-2 border-b border-gray-300 text-sm text-gray-700">30 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
