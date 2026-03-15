'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type: string;
  metadata: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface LocationTracking {
  id: string;
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  is_active: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  admin_id: string | null;
  status: 'active' | 'completed' | 'archived';
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseConversationSubscriptionReturn {
  isConnected: boolean;
  error: string | null;
}

export function useConversationSubscription(
  conversationId: string,
  onNewMessage: (message: Message) => void,
  onLocationUpdate: (location: LocationTracking) => void,
  onConversationUpdate: (conversation: Conversation) => void
): UseConversationSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef<any>(null);
  const subscriptionsRef = useRef<any[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase client
  const initSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
    }
    return supabaseRef.current;
  }, []);

  // Setup subscriptions
  const setupSubscriptions = useCallback(() => {
    try {
      const supabase = initSupabase();

      if (!supabase) {
        setError('Supabase not configured');
        return;
      }

      // Clear existing subscriptions
      subscriptionsRef.current.forEach((sub) => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
      subscriptionsRef.current = [];

      // Subscribe to messages
      const messagesSub = supabase
        .from(`messages:conversation_id=eq.${conversationId}`)
        .on('INSERT', (payload: any) => {
          if (payload.new) {
            onNewMessage(payload.new as Message);
          }
        })
        .on('error', (err: any) => {
          console.error('Messages subscription error:', err);
          setError('Failed to subscribe to messages');
        })
        .subscribe();

      subscriptionsRef.current.push(messagesSub);

      // Subscribe to location updates
      const locationSub = supabase
        .from('location_tracking')
        .on('INSERT', (payload: any) => {
          if (payload.new) {
            onLocationUpdate(payload.new as LocationTracking);
          }
        })
        .on('error', (err: any) => {
          console.error('Location subscription error:', err);
        })
        .subscribe();

      subscriptionsRef.current.push(locationSub);

      // Subscribe to conversation updates
      const conversationSub = supabase
        .from(`conversations:id=eq.${conversationId}`)
        .on('UPDATE', (payload: any) => {
          if (payload.new) {
            onConversationUpdate(payload.new as Conversation);
          }
        })
        .on('error', (err: any) => {
          console.error('Conversation subscription error:', err);
        })
        .subscribe();

      subscriptionsRef.current.push(conversationSub);

      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Subscription setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup subscriptions');
      setIsConnected(false);
    }
  }, [conversationId, onNewMessage, onLocationUpdate, onConversationUpdate, initSupabase]);

  // Auto-reconnect on error (3 second delay)
  useEffect(() => {
    if (error) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect subscriptions...');
        setupSubscriptions();
      }, 3000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [error, setupSubscriptions]);

  // Setup subscriptions on mount
  useEffect(() => {
    setupSubscriptions();

    return () => {
      // Cleanup subscriptions on unmount
      subscriptionsRef.current.forEach((sub) => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
      subscriptionsRef.current = [];

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupSubscriptions]);

  return {
    isConnected,
    error,
  };
}
