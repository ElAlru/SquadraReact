import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../lib/useTheme'

interface Props {
  children: React.ReactNode
  style?: ViewStyle
  scrollable?: boolean
}

/**
 * Contenedor base para todas las pantallas.
 * Centra el contenido y limita el ancho máximo para que se vea bien
 * tanto en móvil como en web.
 */
export default function ScreenContainer({ children, style, scrollable = true }: Props) {
  const c = useTheme()

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: c.fondo }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.inner, style]}>
          {children}
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.scroll, { backgroundColor: c.fondo }]}>
      <View style={[styles.inner, style]}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
})
