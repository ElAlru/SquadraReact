export type DocType = 'DNI' | 'NIE' | 'PASSPORT'

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

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
    const upper = dni.toUpperCase()
    if (!/^[0-9]{8}[A-Z]$/.test(upper)) return false
    const num = parseInt(upper.slice(0, 8), 10)
    return upper[8] === DNI_LETTERS[num % 23]
  }

// Valida formato de NIE español
export const isValidNIE = (nie: string): boolean => {
    const upper = nie.toUpperCase()
    if (!/^[XYZ][0-9]{7}[A-Z]$/.test(upper)) return false
    const prefix: Record<string, string> = { X: '0', Y: '1', Z: '2' }
    const asDni = prefix[upper[0]] + upper.slice(1)
    return isValidDNI(asDni)
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
    const upper = numero.toUpperCase().trim()
    switch (tipo) {
      case 'DNI':      return isValidDNI(upper)
      case 'NIE':      return isValidNIE(upper)
      case 'PASSPORT': return /^[A-Z0-9]{6,20}$/.test(upper)
      default:         return false
    }
  }
