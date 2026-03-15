'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface Location {
  latitude: number;
  longitude: number;
  name: string;
  type: 'braider' | 'customer';
}

interface RealtimeMapProps {
  braiderLocation?: Location;
  customerLocation?: Location;
  distance?: number;
  eta?: number;
}

export function RealtimeMap({
  braiderLocation,
  customerLocation,
  distance,
  eta,
}: RealtimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        setLoading(true);

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google && mapRef.current) {
            // Default center (use braider location if available)
            const center = braiderLocation
              ? { lat: braiderLocation.latitude, lng: braiderLocation.longitude }
              : { lat: 40.7128, lng: -74.006 }; // Default to NYC

            const mapInstance = new window.google.maps.Map(mapRef.current, {
              zoom: 15,
              center,
              mapTypeControl: true,
              fullscreenControl: true,
              streetViewControl: true,
            });

            // Add markers
            if (braiderLocation) {
              new window.google.maps.Marker({
                position: {
                  lat: braiderLocation.latitude,
                  lng: braiderLocation.longitude,
                },
                map: mapInstance,
                title: 'Braider Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
              });
            }

            if (customerLocation) {
              new window.google.maps.Marker({
                position: {
                  lat: customerLocation.latitude,
                  lng: customerLocation.longitude,
                },
                map: mapInstance,
                title: 'Customer Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              });
            }

            // Draw route if both locations exist
            if (braiderLocation && customerLocation) {
              const directionsService = new window.google.maps.DirectionsService();
              const directionsRenderer = new window.google.maps.DirectionsRenderer();
              directionsRenderer.setMap(mapInstance);

              directionsService.route(
                {
                  origin: {
                    lat: braiderLocation.latitude,
                    lng: braiderLocation.longitude,
                  },
                  destination: {
                    lat: customerLocation.latitude,
                    lng: customerLocation.longitude,
                  },
                  travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result: any, status: any) => {
                  if (status === window.google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result);
                  }
                }
              );
            }

            setLoading(false);
          }
        };

        script.onerror = () => {
          setError('Failed to load Google Maps');
          setLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('Error initializing map');
        setLoading(false);
      }
    };

    initMap();
  }, [braiderLocation, customerLocation]);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {/* Info Overlay */}
      {(distance !== undefined || eta !== undefined) && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">Trip Info</h3>
          <div className="space-y-2 text-sm">
            {distance !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-semibold">{distance.toFixed(2)} miles</span>
              </div>
            )}
            {eta !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">ETA:</span>
                <span className="font-semibold">{eta} minutes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
