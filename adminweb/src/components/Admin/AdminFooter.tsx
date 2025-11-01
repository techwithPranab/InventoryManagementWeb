export default function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* System Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Admin Portal</h3>
            <p className="text-slate-300 text-sm mb-4">
              Secure administrative interface for inventory management system.
              Access restricted to authorized administrators only.
            </p>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">System Online</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
            <ul className="space-y-2">
              <li>
                <a href="/admin" className="text-slate-300 hover:text-white text-sm transition-colors duration-200">
                  Admin Dashboard
                </a>
              </li>
              <li>
                <a href="/login" className="text-slate-300 hover:text-white text-sm transition-colors duration-200">
                  User Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Security Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>JWT Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Encrypted Sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm">
            © {currentYear} Inventory Management System. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-slate-400 text-sm">Admin Portal v2.0</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-slate-400">Secure Connection</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
