'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  ContactMail as ContactMailIcon,
  Support as SupportIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface AdminSidebarProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'User Management', href: '/admin/users', icon: PeopleIcon },
  { name: 'Inventory Management', href: '/admin/inventory', icon: InventoryIcon },
  { name: 'Contact Management', href: '/admin/contacts', icon: ContactMailIcon },
  { name: 'Subscription Management', href: '/admin/subscriptions', icon: CreditCardIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: AnalyticsIcon },
  { name: 'Support Tickets', href: '/admin/support', icon: SupportIcon },
];

export default function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close sidebar"
      />

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-900">
          <h2 className="text-white text-lg font-semibold">Admin Portal</h2>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-xs text-slate-400 text-center">
            Inventory Management System
          </div>
        </div>
      </div>
    </>
  );
}
