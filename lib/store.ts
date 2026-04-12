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

// Definimos los roles posibles para reusarlos
type ActiveRole = "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  activeRole: ActiveRole;
  activeClubId: number | null;
  activeClubName: string | null;
  activeClubLogo: string | null;
  activeTeamId: number | null;

  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: UserProfile) => void;
  // 🟢 Firma de la función limpia
  setActiveClub: (
    clubId: number, 
    clubName: string, 
    role: ActiveRole, 
    teamId?: number | null, 
    clubLogo?: string | null
  ) => void;
  
  // 🟢 Añadimos logout para que coincida con el Layout
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isInitialized: false,
  activeRole: null,
  activeClubId: null,
  activeClubName: null,
  activeClubLogo: null,
  activeTeamId: null,

  setAuth: (user, session) => set({ user, session, isInitialized: true }),
  
  setProfile: (profile) => set({ profile }),
  
  setActiveClub: (clubId, clubName, role, teamId = null, clubLogo = null) =>
    set({ 
      activeClubId: clubId, 
      activeClubName: clubName, 
      activeRole: role, 
      activeTeamId: teamId, 
      activeClubLogo: clubLogo 
    }),
    
  // 🟢 logout simplemente llama a clearAuth para que no falle el Layout
  logout: () => {
    set({
      user: null,
      session: null,
      profile: null,
      activeRole: null,
      activeClubId: null,
      activeClubName: null,
      activeClubLogo: null,
      activeTeamId: null,
    });
  },

  clearAuth: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isInitialized: true,
      activeRole: null,
      activeClubId: null,
      activeClubName: null,
      activeClubLogo: null,
      activeTeamId: null,
    }),
}));