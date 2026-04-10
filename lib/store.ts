import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  activeRole: "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER" | null;
  activeClubId: number | null;

  setAuth: (user: User | null, session: Session | null) => void;
  setActiveClub: (clubId: number, role: AuthState["activeRole"]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isInitialized: false,
  activeRole: null,
  activeClubId: null,

  setAuth: (user, session) => set({ user, session, isInitialized: true }),
  setActiveClub: (clubId, role) =>
    set({ activeClubId: clubId, activeRole: role }),
  clearAuth: () =>
    set({
      user: null,
      session: null,
      isInitialized: true,
      activeRole: null,
      activeClubId: null,
    }),
}));
