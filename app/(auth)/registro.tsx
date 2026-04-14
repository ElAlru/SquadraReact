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
  ActivityIndicator,
  Platform, // <-- Importante para diferenciar Web de Móvil
} from 'react-native'
import { isEmpty, isValidDocument, isValidEmail, isValidPassword } from '../../lib/helper'
import { useTheme } from '../../lib/useTheme'
import { router } from 'expo-router'

type DocType = 'DNI' | 'NIE' | 'PASSPORT'

const DOC_TYPES: { label: string; value: DocType }[] = [
  { label: 'DNI', value: 'DNI' },
  { label: 'NIE', value: 'NIE' },
  { label: 'Passport', value: 'PASSPORT' },
]

const DOC_PLACEHOLDER: Record<DocType, string> = {
  DNI: '12345678A',
  NIE: 'X1234567A',
  PASSPORT: 'AAB123456',
}

export default function Register() {
  const c = useTheme()
  const { t } = useTranslation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [docType, setDocType] = useState<DocType>('DNI')
  const [docNumber, setDocNumber] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)

  const pickPhoto = async () => {
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
      setProfilePhoto(result.assets[0].uri)
    }
  }

  // VALIDACIÓN 1: Errores en el formulario local
  const validateFields = (): boolean => {
    if (isEmpty(firstName)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorFirstName', 'El nombre es obligatorio.'))
      return false
    }
    if (isEmpty(lastName)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorLastName', 'Los apellidos son obligatorios.'))
      return false
    }
    if (!isValidEmail(email)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorEmail', 'Por favor, introduce un email válido.'))
      return false
    }
    if (isEmpty(phone)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorPhone', 'El teléfono es obligatorio.'))
      return false
    }
    if (!isValidDocument(docType, docNumber)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorDocument', { type: docType, defaultValue: 'Documento no válido.' }))
      return false
    }
    if (!isValidPassword(password)) {
      Alert.alert(t('common.error', 'Error'), t('register.errorPassword', 'La contraseña debe tener al menos 6 caracteres.'))
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error', 'Error'), t('register.errorConfirmPassword', 'Las contraseñas no coinciden.'))
      return false
    }
    return true
  }

const handleRegister = async () => {
    // Si hay un error en el formulario, se para aquí y no llama a la API
    if (!validateFields()) return

    setIsLoading(true)

    try {
      const payload = {
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        docType: docType,
        docNumber: docNumber.trim().toUpperCase(),
        photoUrl: profilePhoto || "" 
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://squadraapi.onrender.com'

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      })

      // 🛡️ VALIDACIÓN 2: Errores del servidor (Ciberseguridad aplicada)
      if (!response.ok) {
        // Por seguridad, no especificamos si el fallo es por DNI o Email duplicado.
        // Damos un mensaje genérico para evitar enumeración de usuarios.
        Alert.alert(
          "No se pudo completar", 
          "Verifica que los datos sean correctos. Si ya tenías una cuenta creada, intenta iniciar sesión."
        )
        
        // El return hace que se pare el código aquí (no navega a otra pantalla si hay error)
        return
      }

      // PASO 3: ¡ÉXITO! Todo está correcto
      const data = await response.json()
      console.log("¡Registro exitoso! Token:", data.token)
      
      clearFields() // Limpiamos el formulario en segundo plano
      
      // ¡Navegación instantánea a la siguiente pantalla sin preguntar!
      router.replace('/unirse')

    } catch (error) {
      // VALIDACIÓN 4: Error de red (sin internet o servidor apagado)
      console.error("Error conectando con la API:", error)
      Alert.alert(
        "Error de conexión", 
        "No hemos podido conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearFields = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setDocNumber('')
    setDocType('DNI')
    setProfilePhoto(null)
  }

  const mismatch = confirmPassword !== '' && confirmPassword !== password

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>SQUADRA</Text>

      <Text style={[styles.title, { color: c.texto }]}>{t('register.title')}</Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('register.subtitle')}</Text>

      <TouchableOpacity style={styles.photoContainer} onPress={pickPhoto} disabled={isLoading}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={[styles.photo, { borderColor: c.boton }]} />
        ) : (
          <View style={[styles.photoEmpty, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={[styles.photoText, { color: c.subtexto }]}>{t('register.addPhoto')}</Text>
          </View>
        )}
        <View style={[styles.photoEditBadge, { backgroundColor: c.boton, borderColor: c.fondo }]}>
          <Text style={styles.photoEditIcon}>✏️</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.firstName')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('register.firstNamePlaceholder')}
        placeholderTextColor={c.subtexto}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.lastName')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('register.lastNamePlaceholder')}
        placeholderTextColor={c.subtexto}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.email')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('register.emailPlaceholder')}
        placeholderTextColor={c.subtexto}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.phone')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('register.phonePlaceholder')}
        placeholderTextColor={c.subtexto}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.docType')} *</Text>
      <View style={styles.radioGroup}>
        {DOC_TYPES.map((type) => {
          const active = docType === type.value
          return (
            <TouchableOpacity
              key={type.value}
              disabled={isLoading}
              style={[
                styles.radioButton,
                {
                  borderColor: active ? c.boton : c.bordeInput,
                  backgroundColor: active ? `${c.boton}18` : c.input,
                },
              ]}
              onPress={() => {
                setDocType(type.value)
                setDocNumber('')
              }}
            >
              <View style={[styles.radioCircle, { borderColor: active ? c.boton : c.bordeInput }]}>
                {active && <View style={[styles.radioCircleFill, { backgroundColor: c.boton }]} />}
              </View>
              <Text style={[styles.radioText, { color: active ? c.boton : c.texto }]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t('register.docNumber', { type: docType })} *
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={DOC_PLACEHOLDER[docType]}
        placeholderTextColor={c.subtexto}
        value={docNumber}
        onChangeText={setDocNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.password')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('register.passwordPlaceholder')}
        placeholderTextColor={c.subtexto}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>{t('register.confirmPassword')} *</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.input,
            borderColor: mismatch ? '#ef4444' : c.bordeInput,
            color: c.texto,
          },
        ]}
        placeholder={t('register.confirmPasswordPlaceholder')}
        placeholderTextColor={c.subtexto}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
      />
      {mismatch && (
        <Text style={styles.errorText}>{t('register.errorConfirmPassword')}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isLoading ? c.bordeInput : c.boton }]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={c.botonTexto} />
        ) : (
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('register.button')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkContainer} 
        onPress={() => router.replace('/login')}
        disabled={isLoading}
      >
        <Text style={{ color: c.subtexto }}>{t('register.alreadyAccount')} </Text>
        <Text style={[styles.link, { color: c.boton }]}>{t('register.loginLink')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  photoEmpty: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoIcon: {
    fontSize: 24,
  },
  photoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  photoEditBadge: {
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
  photoEditIcon: {
    fontSize: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 16,
    fontSize: 15,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    fontWeight: 'bold',
  },
})