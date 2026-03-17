import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

export default function CrearClub() {
  const c = useTheme()
  const { t } = useTranslation()

  const [nombre, setNombre] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  // pa probar esto luego se generara por detras en el java
  const CODIGO_MOCK = 'ABC-123'

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
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {created ? (
        /* Estado: club creado */
        <View style={styles.successContainer}>

          {/* Logo o avatar */}
          {logo ? (
            <Image source={{ uri: logo }} style={[styles.successLogo, { borderColor: c.boton }]} />
          ) : (
            <View style={[styles.successAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.successAvatarText, { color: c.boton }]}>
                {nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={[styles.title, { color: c.texto }]}>{t('createClub.successTitle')}</Text>
          <Text style={[styles.successClubName, { color: c.boton }]}>{nombre}</Text>
          <Text style={[styles.successMessage, { color: c.subtexto }]}>
            {t('createClub.successMessage')}
          </Text>

          {/* Código de invitación */}
          <View style={[styles.codeCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.codeLabel, { color: c.subtexto }]}>
              {t('createClub.invitationCode')}
            </Text>
            <Text style={[styles.codeValue, { color: c.boton }]}>{CODIGO_MOCK}</Text>
          </View>

          {/* Botón entrar */}
          <TouchableOpacity style={[styles.button, { backgroundColor: c.boton }]}>
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>
              Entrar al club →
            </Text>
          </TouchableOpacity>

        </View>
      ) : (
        /* Estado: formulario */
        <>
          {/* Header */}
          <Text style={[styles.title, { color: c.texto }]}>{t('createClub.title')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('createClub.subtitle')}</Text>

          {/* Logo picker */}
          <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
            {logo ? (
              <Image source={{ uri: logo }} style={[styles.logo, { borderColor: c.boton }]} />
            ) : (
              <View style={[styles.logoEmpty, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={styles.logoIcon}>🏆</Text>
                <Text style={[styles.logoText, { color: c.subtexto }]}>{t('createClub.addLogo')}</Text>
              </View>
            )}
            <View style={[styles.logoEditBadge, { backgroundColor: c.boton, borderColor: c.fondo }]}>
              <Text style={styles.logoEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* Nombre */}
          <Text style={[styles.label, { color: c.subtexto }]}>{t('createClub.name')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            placeholder={t('createClub.namePlaceholder')}
            placeholderTextColor={c.subtexto}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoCorrect={false}
          />

          {/* Botón crear */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, opacity: nombre ? 1 : 0.5 }]}
            onPress={() => nombre && setCreated(true)}
          >
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('createClub.button')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Volver */}
      {!created && (
        <TouchableOpacity style={styles.backContainer}>
          <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
          <Text style={[styles.backText, { color: c.boton }]}>{t('createClub.back')}</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },

  // Logo picker
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 3,
  },
  logoEmpty: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logoEditIcon: {
    fontSize: 12,
  },

  // Input
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 24,
    fontSize: 15,
  },

  // Botón
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Volver
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  successLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 3,
    marginBottom: 20,
  },
  successAvatar: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  successClubName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  codeCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
})