'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-700">
              Guidely
            </Link>
            <div className="hidden md:flex ml-10 space-x-6">
              <Link href="/connections" className="text-gray-600 hover:text-gray-900">Connections</Link>
              <Link href="/creators" className="text-gray-600 hover:text-gray-900">Explore</Link>
              {user?.role === 'CREATOR' && (
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              )}
              {user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">Admin</Link>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/connections/my" className="hidden md:block text-gray-600 hover:text-gray-900">My Connections</Link>
                <Link href="/bookings" className="text-gray-600 hover:text-gray-900">My Bookings</Link>
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                      <Link href="/connections/my" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>My Connections</Link>
                      {(user.role === 'CREATOR' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                        <Link href="/connections/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mentor Dashboard</Link>
                      )}
                      <Link href="/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>My Bookings</Link>
                      <div className="border-t my-1" />
                      <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
