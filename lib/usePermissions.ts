import { useAuthStore } from "./store";

export function usePermissions() {
  const activeRole = useAuthStore((s: any) => s.activeRole);

  const isPresident = activeRole === "PRESIDENT";
  const isStaffRole = activeRole === "COACH" || activeRole === "STAFF";

  return {
    /** Solo el presidente */
    isPresident,

    /** Entrenador o staff técnico (sin ser presidente) */
    isStaff: isStaffRole,

    /** Presidente + entrenador/staff: pueden ver y compartir el código de invitación */
    canSeeInvitationCode: isPresident || isStaffRole,

    /** Solo el presidente puede ver DNI, teléfono y email de otros miembros */
    canSeeSensitiveData: isPresident,

    /** Presidente + entrenador/staff: pueden abrir la ficha de jugadores y staff */
    canOpenMemberDetail: isPresident || isStaffRole,

    /** Solo el presidente puede eliminar miembros */
    canDeleteMembers: isPresident,

    /** Solo el presidente gestiona peticiones de unión */
    canManageRequests: isPresident,
  };
}
