'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useMessageStore } from '@/store/messageStore';
import { Home, Search, Heart, User, MessageSquare, Calendar } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useSupabaseAuthStore();
  const { getUnreadCount } = useMessageStore();

  // Don't show bottom nav on auth pages or admin pages
  if (pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/admin')) {
    return null;
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const unreadCount = user ? getUnreadCount(user.id) : 0;

  const navItems = [
    { icon: Home, label: 'Home', href: '/', show: true },
    { icon: Search, label: 'Browse', href: '/search', show: true },
    { icon: Heart, label: 'Favorites', href: '/favorites', show: user?.role === 'customer' },
    { icon: Calendar, label: 'Bookings', href: user?.role === 'braider' ? '/braider/bookings' : '/booking', show: !!user },
    { icon: MessageSquare, label: 'Messages', href: user?.role === 'customer' ? '/messages' : '/braider/messages', show: !!user, badge: unreadCount },
    { icon: User, label: 'Profile', href: user?.role === 'customer' ? '/profile' : user?.role === 'braider' ? '/braider/dashboard' : '/admin', show: !!user },
  ];

  const visibleItems = navItems.filter(item => item.show);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-200 z-40 md:hidden shadow-2xl">
      <div className="flex items-center justify-between h-20 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 transform hover:scale-110 relative ${
                active
                  ? 'text-primary-600 bg-gradient-to-t from-primary-50 to-transparent shadow-inner'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gradient-to-t hover:from-gray-50 hover:to-transparent'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-125' : ''}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-bold transition-all duration-300 ${active ? 'text-primary-600' : 'text-gray-600'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
