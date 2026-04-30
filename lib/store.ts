import { create } from "zustand";

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

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  activeRole: ActiveRole;
  activeClubId: number | null;
  activeClubName: string | null;
  activeClubLogo: string | null;
  activeTeamId: number | null;
  activeSeasonId: string | null;
  activeSeasonName: string | null;
  themeMode: 'auto' | 'light' | 'dark';
  language: 'es' | 'en';

  setAuth: (token: string, profile: UserProfile) => void;
  setProfile: (profile: UserProfile) => void;
  setSeason: (id: string, name: string) => void;
  setThemeMode: (mode: 'auto' | 'light' | 'dark') => void;
  setLanguage: (lang: 'es' | 'en') => void;
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

export const useAuthStore = create<AuthState>()((set) => ({
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

  setAuth: (token, profile) => set({ token, profile, isInitialized: true }),
  setProfile: (profile) => set({ profile }),
  setSeason: (id, name) => set({ activeSeasonId: id, activeSeasonName: name }),
  setActiveClub: (clubId, clubName, role, teamId = null, clubLogo = null) =>
    set({ activeClubId: clubId, activeClubName: clubName, activeRole: role, activeTeamId: teamId, activeClubLogo: clubLogo }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setLanguage: (lang) => set({ language: lang }),

  logout: () => set({
    token: null, profile: null,
    activeRole: null, activeClubId: null, activeClubName: null,
    activeClubLogo: null, activeTeamId: null,
    activeSeasonId: null, activeSeasonName: null,
  }),

  clearAuth: () => set({
    token: null, profile: null, isInitialized: true,
    activeRole: null, activeClubId: null, activeClubName: null,
    activeClubLogo: null, activeTeamId: null,
    activeSeasonId: null, activeSeasonName: null,
  }),
}));
