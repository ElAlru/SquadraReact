import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useTheme } from '../../lib/useTheme'

export default function CrearClub() {
  const c = useTheme()
  const { t } = useTranslation()
  const { setActiveClub } = useAuthStore()

  const [nombre, setNombre] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Guardaremos la respuesta real del backend
  const [clubData, setClubData] = useState<{ id: number; name: string; invitationCode: string } | null>(null)

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t('register.permissionDeniedTitle'), t('register.permissionDeniedMessage'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) {
      setLogo(result.assets[0].uri)
      // TODO (Futuro): Aquí se debería subir la imagen a S3 y obtener una URL real antes de mandar el formulario.
    }
  }

  const handleCrearClub = async () => {
    if (!nombre.trim()) return
    setIsSubmitting(true)

    try {
      const res = await apiFetch("/api/clubs", {
        method: "POST",
        body: JSON.stringify({
          name: nombre,
          logoUrl: null // Mandamos null hasta que implementemos subida a AWS/Firebase
        })
      })

      if (res.ok) {
        const data = await res.json()
        setClubData(data) // Guardamos ID y Código Real
        setCreated(true)  // Cambiamos a pantalla de éxito
      } else {
        Alert.alert("Error", "No se pudo crear el club. Inténtalo de nuevo.")
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Fallo de conexión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntrarClub = () => {
    if (clubData) {
      // Usamos el estado global Zustand para "loguear" al presidente en este club
      setActiveClub(clubData.id, "PRESIDENT", null)
      router.replace("/(club)/inicio")
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>SQUADRA</Text>

      {created && clubData ? (
        /* ESTADO 2: CLUB CREADO (ÉXITO) */
        <View style={styles.successContainer}>
          {logo ? (
            <Image source={{ uri: logo }} style={[styles.successLogo, { borderColor: c.boton }]} />
          ) : (
            <View style={[styles.successAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.successAvatarText, { color: c.boton }]}>
                {clubData.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={[styles.title, { color: c.texto }]}>{t('createClub.successTitle', '¡Club creado!')}</Text>
          <Text style={[styles.successClubName, { color: c.boton }]}>{clubData.name}</Text>
          <Text style={[styles.successMessage, { color: c.subtexto }]}>
            {t('createClub.successMessage', 'Tu club ha sido creado. Comparte el código con tus jugadores para que puedan unirse.')}
          </Text>

          {/* CÓDIGO REAL GENERADO POR BACKEND */}
          <View style={[styles.codeCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.codeLabel, { color: c.subtexto }]}>
              {t('createClub.invitationCode', 'CÓDIGO DE INVITACIÓN')}
            </Text>
            <Text style={[styles.codeValue, { color: c.boton }]}>{clubData.invitationCode}</Text>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: c.boton, width: '100%' }]} onPress={handleEntrarClub}>
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>Entrar al club →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ESTADO 1: FORMULARIO DE CREACIÓN */
        <>
          <Text style={[styles.title, { color: c.texto }]}>{t('createClub.title', 'Crear club')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>
            {t('createClub.subtitle', 'Configura los datos básicos de tu club')}
          </Text>

          <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
            {logo ? (
              <Image source={{ uri: logo }} style={[styles.logo, { borderColor: c.boton }]} />
            ) : (
              <View style={[styles.logoEmpty, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={styles.logoIcon}>🏆</Text>
                <Text style={[styles.logoText, { color: c.subtexto }]}>{t('createClub.addLogo', 'Añadir logo')}</Text>
              </View>
            )}
            <View style={[styles.logoEditBadge, { backgroundColor: c.boton, borderColor: c.fondo }]}>
              <Text style={styles.logoEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.label, { color: c.subtexto }]}>{t('createClub.name', 'Nombre del club')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            placeholder={t('createClub.namePlaceholder', 'Ej: FC Ejemplo')}
            placeholderTextColor={c.subtexto}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, opacity: nombre && !isSubmitting ? 1 : 0.5 }]}
            onPress={handleCrearClub}
            disabled={!nombre || isSubmitting}
          >
            {isSubmitting ? (
               <ActivityIndicator color={c.botonTexto} />
            ) : (
               <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('createClub.button', 'Crear club')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* BOTÓN VOLVER (Solo visible si no se ha creado) */}
      {!created && (
        <TouchableOpacity style={styles.backContainer} onPress={() => router.back()} disabled={isSubmitting}>
          <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
          <Text style={[styles.backText, { color: c.boton }]}>{t('createClub.back', 'Volver')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, paddingBottom: 40 },
  brand: { fontSize: 13, fontWeight: 'bold', color: '#C9A84C', letterSpacing: 4, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  
  logoContainer: { alignSelf: 'center', marginBottom: 32, position: 'relative' },
  logo: { width: 100, height: 100, borderRadius: 24, borderWidth: 3 },
  logoEmpty: { width: 100, height: 100, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 11, fontWeight: '500' },
  logoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  logoEditIcon: { fontSize: 12 },
  
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, marginBottom: 24, fontSize: 15 },
  
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  buttonText: { fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  
  backContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8 },
  backArrow: { fontSize: 18, fontWeight: 'bold' },
  backText: { fontSize: 14, fontWeight: '600' },
  
  successContainer: { alignItems: 'center', paddingTop: 8 },
  successLogo: { width: 100, height: 100, borderRadius: 24, borderWidth: 3, marginBottom: 20 },
  successAvatar: { width: 100, height: 100, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successAvatarText: { fontSize: 40, fontWeight: 'bold' },
  successClubName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  successMessage: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
  codeCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8, marginBottom: 28 },
  codeLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  codeValue: { fontSize: 28, fontWeight: 'bold', letterSpacing: 6 },
})