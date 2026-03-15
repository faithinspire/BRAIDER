'use client';

import { useEffect } from 'react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';

export function AuthInitializer() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth and wait for it to complete
        const authStore = useSupabaseAuthStore.getState();
        await authStore.initializeSession();

        // Get the initialized user
        const user = useSupabaseAuthStore.getState().user;

        // If user is a braider, initialize braider store
        if (user?.role === 'braider') {
          const braiderStore = useSupabaseBraiderStore.getState();
          await braiderStore.initializeStore();
        }

        // Track user IP
        if (user) {
          try {
            await fetch('/api/user/ip', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            });
          } catch (err) {
            console.error('Failed to track IP:', err);
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return null;
}
