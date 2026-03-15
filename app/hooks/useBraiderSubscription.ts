'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface LocationUpdate {
  id: string;
  booking_id: string;
  braider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

export function useBraiderSubscription(
  booking_id: string,
  onNewMessage?: (message: Message) => void,
  onLocationUpdate?: (location: LocationUpdate) => void
) {
  const { user } = useSupabaseAuthStore();
  const [isConnected, setIsConnected] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Get conversation ID
  useEffect(() => {
    if (!user || !booking_id) return;

    const getConversationId = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('booking_id', booking_id)
          .eq('braider_id', user.id)
          .single();

        if (error) throw error;
        setConversationId(data?.id || null);
      } catch (err) {
        console.error('Error getting conversation ID:', err);
      }
    };

    getConversationId();
  }, [user, booking_id]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (onNewMessage) {
            onNewMessage(payload.new as Message);
          }
        }
      )
      .on('subscribe', () => {
        setIsConnected(true);
      })
      .on('close', () => {
        setIsConnected(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, onNewMessage]);

  // Subscribe to location updates
  useEffect(() => {
    if (!booking_id) return;

    const channel = supabase
      .channel(`location:${booking_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `booking_id=eq.${booking_id}`,
        },
        (payload) => {
          if (onLocationUpdate) {
            onLocationUpdate(payload.new as LocationUpdate);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [booking_id, onLocationUpdate]);

  return {
    isConnected,
  };
}
