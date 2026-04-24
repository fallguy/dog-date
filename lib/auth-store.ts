import { create } from 'zustand';

type AuthState = {
  isSignedIn: boolean;
  userName: string | null;
  signIn: (name?: string) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  isSignedIn: false,
  userName: null,
  signIn: (name = 'Demo User') => set({ isSignedIn: true, userName: name }),
  signOut: () => set({ isSignedIn: false, userName: null }),
}));
