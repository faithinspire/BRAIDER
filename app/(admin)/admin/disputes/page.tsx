'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { AlertTriangle } from 'lucide-react';

export default function DisputesPage() {
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

  const disputes = [
    { id: 1, customer: 'Sarah Johnson', braider: 'Maria Garcia', reason: 'Service not completed', status: 'open' },
    { id: 2, customer: 'John Smith', braider: 'Jessica Lee', reason: 'Quality issue', status: 'resolved' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-1 sm:mb-2">Disputes</h1>
          <p className="text-primary-100 text-sm sm:text-base">Manage customer disputes and resolutions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-3 sm:space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-smooth">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{dispute.reason}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{dispute.customer} vs {dispute.braider}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ${
                  dispute.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {dispute.status}
                </span>
              </div>
              <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm sm:text-base font-semibold">
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
