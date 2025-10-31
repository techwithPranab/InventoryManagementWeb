import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses just getting started',
      features: [
        'Up to 1,000 products',
        '1 warehouse location',
        'Basic reporting',
        'Email support',
        'Mobile app access',
        'Standard integrations'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      popular: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing businesses with advanced needs',
      features: [
        'Up to 10,000 products',
        '5 warehouse locations',
        'Advanced analytics',
        'Priority support',
        'Mobile app access',
        'All integrations',
        'Custom workflows',
        'API access'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For large organizations with complex requirements',
      features: [
        'Unlimited products',
        'Unlimited warehouses',
        'Custom reporting',
        '24/7 phone support',
        'Mobile app access',
        'All integrations',
        'Custom workflows',
        'Full API access',
        'Dedicated account manager',
        'Custom training'
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'We offer a 14-day free trial for all plans. No credit card required to get started.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your account will remain active until the end of your billing period.'
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes, we offer a 20% discount when you pay annually instead of monthly.'
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
              Simple, Transparent{' '}
              <span className="text-blue-200">Pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your business. All plans include our core features 
              with no hidden fees or setup costs.
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-4">
                <span className="text-blue-200">Monthly</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only" />
                  <div className="w-10 h-6 bg-blue-400 rounded-full cursor-pointer"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                </div>
                <span className="text-white font-semibold">Annual <span className="text-green-300">(Save 20%)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div key={index} className={`bg-white rounded-lg shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="bg-blue-500 text-white text-center py-2 font-semibold">
                      Most Popular
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`block w-full text-center font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${plan.buttonStyle}`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                All Plans Include
              </h2>
              <p className="text-xl text-gray-600">
                Core features available across all subscription tiers
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
                <p className="text-gray-600">Intuitive interface designed for users of all skill levels</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Performance</h3>
                <p className="text-gray-600">Lightning-fast response times and real-time updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about our pricing and plans
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Inventory Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using our platform to streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
