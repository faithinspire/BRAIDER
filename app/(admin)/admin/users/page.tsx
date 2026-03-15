'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Search, MoreVertical } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const { user } = useSupabaseAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const users = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'customer', status: 'active' },
    { id: 2, name: 'Maria Garcia', email: 'maria@example.com', role: 'braider', status: 'active' },
    { id: 3, name: 'John Smith', email: 'john@example.com', role: 'customer', status: 'inactive' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-1 sm:mb-2">Users</h1>
          <p className="text-primary-100 text-sm sm:text-base">Manage all platform users</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-12 pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-primary-600 transition-smooth text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50 transition-smooth">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words">{u.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 break-all">{u.email}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-smooth">
                        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
