'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Contact, defaultContact } from '@/models/Contact';

export default function AboutUs() {
  const [contact, setContact] = useState<Contact>(defaultContact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
          const data = await response.json();
          setContact(data);
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  const stats = [
    { number: '10,000+', label: 'Active Users' },
    { number: '500+', label: 'Businesses Served' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Mission-Driven',
      description: 'We are committed to empowering businesses with cutting-edge inventory management solutions that drive growth and efficiency.'
    },
    {
      icon: '🔒',
      title: 'Security First',
      description: 'Your data security and privacy are our top priorities. We implement enterprise-grade security measures to protect your information.'
    },
    {
      icon: '🚀',
      title: 'Innovation',
      description: 'We continuously innovate and adapt to meet the evolving needs of modern businesses and their inventory management requirements.'
    },
    {
      icon: '🤝',
      title: 'Customer-Centric',
      description: 'Our customers are at the heart of everything we do. We build solutions that solve real problems and deliver tangible value.'
    }
  ];

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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              About Inventory Pro
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Empowering businesses worldwide with intelligent inventory management solutions.
              We help companies streamline operations, reduce costs, and scale efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Born from Experience</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Inventory Pro was founded in 2020 by a team of supply chain and technology experts who
                  witnessed firsthand the challenges businesses face with traditional inventory management systems.
                  We saw the need for a modern, intelligent solution that could adapt to the complexities of
                  today's business environment.
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  What started as a simple idea has grown into a comprehensive platform that serves thousands
                  of businesses across industries. Our commitment to innovation and customer success drives
                  everything we do.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-blue-600 text-xl">📈</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Rapid Growth</h4>
                      <p className="text-gray-600 text-sm">From startup to industry leader in just 3 years</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-green-600 text-xl">🌍</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Global Reach</h4>
                      <p className="text-gray-600 text-sm">Serving businesses in 50+ countries worldwide</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-purple-600 text-xl">🏆</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Industry Recognition</h4>
                      <p className="text-gray-600 text-sm">Winner of multiple SaaS and innovation awards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The principles that guide our decisions and shape our culture
              </p>
              <div className="w-24 h-1 bg-blue-600 mx-auto mt-8"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow duration-300">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA Section */}
      <div className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Inventory Pro to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
