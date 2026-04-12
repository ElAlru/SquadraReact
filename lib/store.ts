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
  activeTeamId: number | null; // 👈 NUEVO: Guardamos el ID del equipo

  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: UserProfile) => void;
  // 👈 MODIFICADO: Añadimos teamId como tercer parámetro opcional
  setActiveClub: (clubId: number, role: AuthState["activeRole"], teamId?: number | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isInitialized: false,
  activeRole: null,
  activeClubId: null,
  activeTeamId: null, // 👈 NUEVO: Estado inicial

  setAuth: (user, session) => set({ user, session, isInitialized: true }),
  
  setProfile: (profile) => set({ profile }),
  
  // 👈 MODIFICADO: Recibe el teamId (por defecto null) y lo guarda en el estado
  setActiveClub: (clubId, role, teamId = null) =>
    set({ activeClubId: clubId, activeRole: role, activeTeamId: teamId }),
    
  clearAuth: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isInitialized: true,
      activeRole: null,
      activeClubId: null,
      activeTeamId: null, // 👈 NUEVO: Lo limpiamos al cerrar sesión
    }),
}));