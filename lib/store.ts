import { create } from "zustand";

// 🟢 1. Perfil del usuario
interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  docType: string | null;
  docNumber: string | null;
  photoUrl: string | null;
}

type ActiveRole = "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER" | null;

// 🟢 2. Definición de lo que guarda el almacén (Estado)
interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  
  activeRole: ActiveRole;
  activeClubId: number | null;
  activeClubName: string | null;
  activeClubLogo: string | null;
  activeTeamId: number | null;
  
  // Temporada actual (etiqueta como "24-25")
  activeSeasonId: string | null; 
  activeSeasonName: string | null;

  //Tema y lenguaje
  themeMode: 'auto' | 'light' | 'dark'
  language: 'es' | 'en'


  // Acciones (Funciones para cambiar los datos)
  setAuth: (token: string, profile: UserProfile) => void;
  setProfile: (profile: UserProfile) => void;
  setSeason: (id: string, name: string) => void;
  setThemeMode: (mode: 'auto' | 'light' | 'dark') => void
  setLanguage: (lang: 'es' | 'en') => void
  setActiveClub: (
    clubId: number, 
    clubName: string, 
    role: ActiveRole, 
    teamId?: number | null, 
    clubLogo?: string | null
  ) => void;
  
  logout: () => void;
  clearAuth: () => void;
}

// Creación del almacén con los valores iniciales
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  profile: null,
  isInitialized: false,
  themeMode: 'auto',
  language: 'es',
  activeRole: null,
  activeClubId: null,
  activeClubName: null,
  activeClubLogo: null,
  activeTeamId: null,
  activeSeasonId: null,
  activeSeasonName: null,

  // Implementación de las funciones
  setAuth: (token, profile) => set({ token, profile, isInitialized: true }),
  
  setProfile: (profile) => set({ profile }),

  setSeason: (id, name) => set({ 
    activeSeasonId: id, 
    activeSeasonName: name 
  }),

  setActiveClub: (clubId, clubName, role, teamId = null, clubLogo = null) =>
    set({ 
      activeClubId: clubId, 
      activeClubName: clubName, 
      activeRole: role, 
      activeTeamId: teamId, 
      activeClubLogo: clubLogo 
    }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setLanguage: (lang) => set({ language: lang }),
    
  logout: () => {
    set({
      token: null, profile: null,
      activeRole: null, activeClubId: null, activeClubName: null,
      activeClubLogo: null, activeTeamId: null,
      activeSeasonId: null, activeSeasonName: null
    });
  },

  clearAuth: () =>
    set({
      token: null, profile: null, isInitialized: true,
      activeRole: null, activeClubId: null, activeClubName: null,
      activeClubLogo: null, activeTeamId: null,
      activeSeasonId: null, activeSeasonName: null
    }),
}));