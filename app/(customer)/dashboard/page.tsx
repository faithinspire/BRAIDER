'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useBraiders } from '@/app/hooks/useBraiders';
import { useBookingStore } from '@/store/bookingStore';
import { Heart, Star, MapPin, Search, Loader, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { braiders } = useBraiders();
  const { getBookingsByCustomer } = useBookingStore();
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [filteredBraiders, setFilteredBraiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Check if user is authenticated and is a customer
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'customer') {
      router.push('/');
      return;
    }

    // Load favorites from localStorage
    const saved = localStorage.getItem(`favorites_${user.id}`);
    if (saved) setFavorites(JSON.parse(saved));
    
    // Load bookings from store
    const bookings = getBookingsByCustomer(user.id);
    setMyBookings(bookings);
  }, [user, authLoading, router, getBookingsByCustomer]);

  // Filter and search braiders in real-time
  const filterBraiders = useCallback(() => {
    setLoading(true);
    try {
      let results = braiders;

      // Search filter
      if (searchQuery) {
        results = results.filter(
          (b) =>
            b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.specialties && b.specialties.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())))
        );
      }

      // Specialty filter
      if (selectedSpecialty) {
        results = results.filter((b) => b.specialties && b.specialties.includes(selectedSpecialty));
      }

      // Rating filter
      results = results.filter((b) => b.rating_avg >= minRating);

      // Price filter
      results = results.filter((b) => {
        if (!b.services || b.services.length === 0) return true;
        const minPrice = Math.min(...b.services.map((s: any) => s.price));
        return minPrice <= maxPrice;
      });

      setFilteredBraiders(results);
    } finally {
      setLoading(false);
    }
  }, [braiders, searchQuery, selectedSpecialty, minRating, maxPrice]);

  useEffect(() => {
    filterBraiders();
  }, [filterBraiders]);

  const toggleFavorite = useCallback((braider_id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(braider_id)
        ? prev.filter((id) => id !== braider_id)
        : [...prev, braider_id];
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updated));
      return updated;
    });
  }, [user?.id]);

  if (!user || user.role !== 'customer') {
    return null;
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const specialties = ['Box Braids', 'Knotless', 'Cornrows', 'Locs', 'Twists', 'Kids Braids'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-2">Welcome, {user.full_name}!</h1>
          <p className="text-primary-100 text-lg">Find and book your perfect braider</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-semibold transition-smooth border-b-2 ${
              activeTab === 'browse'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Braiders
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-semibold transition-smooth border-b-2 flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-5 h-5" />
            My Bookings {myBookings.length > 0 && `(${myBookings.length})`}
          </button>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search & Filters */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or specialty..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth"
                    />
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((s: string) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600"
                  >
                    <option value="0">All ratings</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {loading ? 'Filtering...' : `Found ${filteredBraiders.length} braiders`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialty('');
                    setMinRating(0);
                    setMaxPrice(500);
                  }}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : filteredBraiders.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">No braiders found matching your criteria</p>
                <Link href="/search" className="text-primary-600 font-semibold hover:text-primary-700">
                  Browse all braiders →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBraiders.map((braider, idx) => (
                  <div
                    key={braider.id}
                    className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-smooth animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-200 to-accent-200">
                      {braider.avatar_url && (
                        <img
                          src={braider.avatar_url}
                          alt={braider.full_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => toggleFavorite(braider.id)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-smooth"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(braider.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                    <div>
                          <h3 className="text-xl font-semibold text-gray-900">{braider.full_name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{braider.rating_avg.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({braider.rating_count})</span>
                          </div>
                        </div>
                        {braider.verification_status !== 'unverified' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{braider.bio}</p>

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{braider.travel_radius_miles} miles radius</span>
                        </div>
                        {braider.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {braider.specialties.slice(0, 2).map((specialty: string) => (
                              <span key={specialty} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {braider.services.length > 0 && (
                        <div className="mb-4 pb-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Services from:</p>
                          <p className="text-lg font-bold text-primary-600">
                            ${Math.min(...braider.services.map((service: any) => service.price)).toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link
                          href={`/braider/${braider.user_id || braider.id}`}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-center font-semibold text-sm"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/braider/${braider.user_id || braider.id}`}
                          className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-smooth font-semibold text-sm"
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">No bookings yet</p>
                <Link href="/booking" className="text-primary-600 font-semibold hover:text-primary-700">
                  Book your first appointment →
                </Link>
              </div>
            ) : (
              myBookings.map((booking, idx) => (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-smooth animate-slide-up border-l-4 ${
                    booking.status === 'confirmed'
                      ? 'border-green-500'
                      : booking.status === 'completed'
                      ? 'border-blue-500'
                      : booking.status === 'cancelled'
                      ? 'border-red-500'
                      : 'border-yellow-500'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.braider_name}</h3>
                      <p className="text-sm text-gray-600">{booking.service_name}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{booking.appointment_date} • ${booking.service_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.location_address}</span>
                    </div>
                    {booking.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-semibold text-gray-700">Notes:</p>
                        <p>{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      href="/braider/messages"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-smooth text-center font-semibold text-sm"
                    >
                      Message Braider
                    </Link>
                    {booking.status === 'pending' && (
                      <button
                        className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-smooth font-semibold text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
