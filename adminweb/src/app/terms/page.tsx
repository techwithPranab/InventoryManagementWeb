'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { Contact, defaultContact } from '@/models/Contact';

export default function TermsOfService() {
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
              Terms of Service
            </h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> November 1, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to Inventory Management System. These Terms of Service ("Terms") govern your use of our inventory management platform and services ("Service"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 mb-4">
                  Inventory Management System provides a comprehensive platform for managing inventory, tracking products, processing orders, and generating reports. Our Service includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>Product and category management</li>
                  <li>Warehouse and inventory tracking</li>
                  <li>Purchase and sales order management</li>
                  <li>Reporting and analytics</li>
                  <li>User management and permissions</li>
                  <li>Data backup and security features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Registration</h3>
                <p className="text-gray-700 mb-4">
                  To use our Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Responsibilities</h3>
                <p className="text-gray-700 mb-4">
                  You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>Provide accurate and current information</li>
                  <li>Maintain the security of your password</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Use the Service only for lawful purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription and Payment</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Subscription Plans</h3>
                <p className="text-gray-700 mb-4">
                  We offer various subscription plans with different features and pricing. Subscription fees are billed in advance and are non-refundable except as expressly stated in our refund policy.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Payment Terms</h3>
                <p className="text-gray-700 mb-4">
                  By subscribing to our Service, you agree to pay all applicable fees. Payments are processed securely through third-party payment processors. You are responsible for providing valid payment information.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Billing and Renewals</h3>
                <p className="text-gray-700 mb-4">
                  Subscriptions automatically renew unless cancelled. You may cancel your subscription at any time, but cancellation will not result in a refund of previously paid fees.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
                <p className="text-gray-700 mb-4">
                  You agree not to use the Service for any unlawful or prohibited purposes, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                  <li>Violating any applicable laws or regulations</li>
                  <li>Infringing on intellectual property rights</li>
                  <li>Transmitting harmful or malicious code</li>
                  <li>Attempting to gain unauthorized access</li>
                  <li>Interfering with the Service's operation</li>
                  <li>Using the Service for fraudulent purposes</li>
                  <li>Sharing account credentials with unauthorized users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Ownership and Privacy</h2>
                <p className="text-gray-700 mb-4">
                  You retain ownership of all data you input into our Service. We respect your privacy and handle your data in accordance with our Privacy Policy. You are responsible for the accuracy and legality of the data you provide.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Our Intellectual Property</h3>
                <p className="text-gray-700 mb-4">
                  The Service and all related content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Your Content</h3>
                <p className="text-gray-700 mb-4">
                  You retain ownership of content you create or upload to the Service. By using the Service, you grant us a limited license to use, store, and process your content as necessary to provide the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability and Support</h2>
                <p className="text-gray-700 mb-4">
                  We strive to provide reliable service but cannot guarantee uninterrupted availability. We provide technical support during business hours and will use reasonable efforts to resolve issues promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Termination by You</h3>
                <p className="text-gray-700 mb-4">
                  You may terminate your account at any time. Upon termination, your access to the Service will cease, but we may retain your data as required by law or for legitimate business purposes.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Termination by Us</h3>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your account for violations of these Terms. We will provide notice of termination when possible.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimers and Limitations</h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Service Disclaimers</h3>
                <p className="text-gray-700 mb-4">
                  The Service is provided "as is" without warranties of any kind. We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Limitation of Liability</h3>
                <p className="text-gray-700 mb-4">
                  Our liability is limited to the amount paid by you for the Service in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
                <p className="text-gray-700 mb-4">
                  You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
                <p className="text-gray-700 mb-4">
                  These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We may update these Terms from time to time. We will notify you of material changes via email or through the Service. Continued use of the Service constitutes acceptance of updated Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><strong>Email:</strong> {contact.legalEmail || contact.email}</p>
                  <p className="text-gray-700"><strong>Phone:</strong> {contact.phone}</p>
                  <p className="text-gray-700"><strong>Address:</strong> {contact.address}</p>
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
