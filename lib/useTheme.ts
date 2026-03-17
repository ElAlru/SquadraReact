import { useColorScheme } from 'react-native'
import { colores } from './theme'

export const useTheme = () => {
  const scheme = useColorScheme()
  return scheme === 'dark' ? colores.oscuro : colores.claro
}