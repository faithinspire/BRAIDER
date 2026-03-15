'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Menu, X, LogOut, Home, Search, User, Settings, LayoutDashboard, MessageSquare, Wallet, Image } from 'lucide-react';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useSupabaseAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
      isActive(path)
        ? 'bg-primary-100 text-primary-600 font-semibold shadow-md'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-serif font-bold text-lg hidden sm:inline">Braidly</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link href="/" className={navLinkClass('/')}>
                  <Home className="w-4 h-4 inline mr-1" />
                  Home
                </Link>
                <Link href="/search" className={navLinkClass('/search')}>
                  <Search className="w-4 h-4 inline mr-1" />
                  Browse
                </Link>
                <Link href="/login" className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className={navLinkClass('/')}>
                  <Home className="w-4 h-4 inline mr-1" />
                  Home
                </Link>
                <Link href="/search" className={navLinkClass('/search')}>
                  <Search className="w-4 h-4 inline mr-1" />
                  Browse
                </Link>

                {user.role === 'customer' && (
                  <>
                    <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 inline mr-1" />
                      Dashboard
                    </Link>
                    <Link href="/profile" className={navLinkClass('/profile')}>
                      <User className="w-4 h-4 inline mr-1" />
                      Profile
                    </Link>
                  </>
                )}

                {user.role === 'braider' && (
                  <>
                    <Link href="/braider/dashboard" className={navLinkClass('/braider/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 inline mr-1" />
                      Dashboard
                    </Link>
                    <Link href="/braider/services" className={navLinkClass('/braider/services')}>
                      <Settings className="w-4 h-4 inline mr-1" />
                      Services
                    </Link>
                    <Link href="/braider/portfolio" className={navLinkClass('/braider/portfolio')}>
                      <Image className="w-4 h-4 inline mr-1" />
                      Portfolio
                    </Link>
                    <Link href="/braider/wallet" className={navLinkClass('/braider/wallet')}>
                      <Wallet className="w-4 h-4 inline mr-1" />
                      Wallet
                    </Link>
                    <Link href="/braider/messages" className={navLinkClass('/braider/messages')}>
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Messages
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link href="/admin" className={navLinkClass('/admin')}>
                      <LayoutDashboard className="w-4 h-4 inline mr-1" />
                      Admin
                    </Link>
                    <Link href="/admin/users" className={navLinkClass('/admin/users')}>
                      <User className="w-4 h-4 inline mr-1" />
                      Users
                    </Link>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-3 rounded-lg transition-all duration-300 transform hover:scale-110 relative"
          style={{
            background: mobileMenuOpen 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.15) 100%)'
              : 'transparent'
          }}
        >
          {mobileMenuOpen && (
            <div 
              className="absolute inset-0 rounded-lg opacity-30 animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite'
              }}
            />
          )}
          <div className="relative z-10">
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-primary-600 transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 transition-transform duration-300" />
            )}
          </div>
        </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 bg-gradient-to-b from-white to-gray-50">
            {!user ? (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                >
                  Browse Braiders
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-bold"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                >
                  Browse
                </Link>

                {user.role === 'customer' && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Messages
                    </Link>
                  </>
                )}

                {user.role === 'braider' && (
                  <>
                    <Link
                      href="/braider/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/braider/services"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Services
                    </Link>
                    <Link
                      href="/braider/portfolio"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Portfolio
                    </Link>
                    <Link
                      href="/braider/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Messages
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Users
                    </Link>
                    <Link
                      href="/admin/conversations"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Conversations
                    </Link>
                    <Link
                      href="/admin/payments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 font-semibold text-gray-900 hover:bg-primary-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md"
                    >
                      Payments
                    </Link>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:translate-x-1 hover:shadow-md font-bold"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      </div>
    </nav>
  );
}
