import { useColorScheme } from 'react-native'
import { useAuthStore } from './store'
import { colores } from './theme'

  export const useTheme = () => {
    const themeMode = useAuthStore((state) => state.themeMode)
    const deviceScheme = useColorScheme()
    const scheme = themeMode === 'auto' ? deviceScheme : themeMode
    return scheme === 'dark' ? colores.oscuro : colores.claro
  }