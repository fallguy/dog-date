import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
};

/**
 * Supabase-backed auth store.
 *
 * Call `initialize()` once on app boot — it reads the persisted session from
 * AsyncStorage and subscribes to future auth state changes.
 *
 * Components read `session` to know who's signed in. `null` after init = signed out.
 */
export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  isInitialized: false,
  initialize: async () => {
    if (get().isInitialized) return;
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, isInitialized: true });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    // Listener above will clear `session`.
  },
}));
