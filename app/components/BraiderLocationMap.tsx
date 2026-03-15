'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

interface LocationData {
  id: string;
  booking_id: string;
  customer_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

interface BraiderLocationMapProps {
  booking_id: string;
}

export function BraiderLocationMap({ booking_id }: BraiderLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!mapRef.current) return;

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps');
        const { AdvancedMarkerElement } = await loader.importLibrary('marker');

        // Get latest customer location
        const { data: locations, error: locErr } = await supabase
          .from('location_tracking')
          .select('*')
          .eq('booking_id', booking_id)
          .neq('braider_id', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (locErr) throw locErr;

        const location = locations?.[0];
        const center = location
          ? { lat: location.latitude, lng: location.longitude }
          : { lat: 40.7128, lng: -74.006 };

        mapInstance.current = new Map(mapRef.current, {
          zoom: 15,
          center,
          mapId: 'DEMO_MAP_ID',
        });

        if (location) {
          markerRef.current = new google.maps.Marker({
            map: mapInstance.current,
            position: center,
            title: 'Customer Location',
          });

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <p class="font-semibold">Customer Location</p>
                <p class="text-sm text-gray-600">Accuracy: ${location.accuracy.toFixed(0)}m</p>
                ${location.speed ? `<p class="text-sm text-gray-600">Speed: ${(location.speed * 3.6).toFixed(1)} km/h</p>` : ''}
              </div>
            `,
          });

          markerRef.current.addListener('click', () => {
            infoWindow.open(mapInstance.current, markerRef.current);
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    initMap();
  }, [booking_id]);

  // Subscribe to location updates
  useEffect(() => {
    if (!mapInstance.current) return;

    const channel = supabase
      .channel(`braider-location:${booking_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `booking_id=eq.${booking_id}`,
        },
        (payload) => {
          const location = payload.new as LocationData;

          if (location.braider_id) {
            const newPosition = {
              lat: location.latitude,
              lng: location.longitude,
            };

            if (markerRef.current) {
              markerRef.current.setPosition(newPosition);
            } else {
              markerRef.current = new google.maps.Marker({
                map: mapInstance.current,
                position: newPosition,
                title: 'Customer Location',
              });
            }

            mapInstance.current?.panTo(newPosition);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [booking_id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
