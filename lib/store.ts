import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  docType: string | null;
  docNumber: string | null;
  photoUrl: string | null;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  activeRole: "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER" | null;
  activeClubId: number | null;

  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: UserProfile) => void;
  setActiveClub: (clubId: number, role: AuthState["activeRole"]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isInitialized: false,
  activeRole: null,
  activeClubId: null,

  setAuth: (user, session) => set({ user, session, isInitialized: true }),
  setProfile: (profile) => set({ profile }),
  setActiveClub: (clubId, role) =>
    set({ activeClubId: clubId, activeRole: role }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isInitialized: true,
      activeRole: null,
      activeClubId: null,
    }),
}));
