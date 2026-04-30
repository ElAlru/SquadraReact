export type DocType = 'DNI' | 'NIE' | 'PASSPORT'

// Comprueba si un string está vacío o solo tiene espacios
export const isEmpty = (texto: string): boolean => {
  return texto.trim() === ''
}

export const isNotEmpty = (texto: string): boolean => {
  return texto.trim() !== ''
}

// Valida formato de email
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Valida formato de DNI español
export const isValidDNI = (dni: string): boolean => {
  const regex = /^[0-9]{8}[A-Z]$/
  return regex.test(dni.toUpperCase())
}

// Valida formato de NIE español
export const isValidNIE = (nie: string): boolean => {
  const regex = /^[XYZ][0-9]{7}[A-Z]$/
  return regex.test(nie.toUpperCase())
}

// Valida contraseña mínimo 6 caracteres
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6
}



// Limpia mensajes de error de Spring Boot como "400 BAD_REQUEST "mensaje""
// devolviendo solo la parte legible para el usuario.
export const parseApiError = (raw: string, fallback = 'Error desconocido.'): string => {
  if (!raw?.trim()) return fallback
  const match = raw.trim().match(/^\d{3}\s+\S+\s+"(.+)"$/)
  return match ? match[1] : raw.trim()
}

export const isValidDocument = (tipo: DocType, numero: string): boolean => {
  switch (tipo) {
    case 'DNI':
      return /^[0-9]{8}[A-Z]$/.test(numero.toUpperCase())
    case 'NIE':
      return /^[XYZ][0-9]{7}[A-Z]$/.test(numero.toUpperCase())
    case 'PASSPORT':
      return /^[A-Z]{3}[0-9]{6}$/.test(numero.toUpperCase())
    default:
      return false
  }
}