import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { isEmpty, isValidEmail } from '../../lib/helper'
import { useTheme } from '../../lib/useTheme'
import { router } from 'expo-router'

export default function Login() {
  const c = useTheme()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // VALIDACIÓN LOCAL
  const validateFields = (): boolean => {
    if (!isValidEmail(email)) {
      Alert.alert(t('common.error', 'Error'), t('login.errorEmail', 'Introduce un email válido.'))
      return false
    }
    if (isEmpty(password)) {
      Alert.alert(t('common.error', 'Error'), t('login.errorPassword', 'La contraseña es obligatoria.'))
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateFields()) return

    setIsLoading(true)

    try {
      const payload = {
        email: email.trim(),
        password: password,
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://squadraapi.onrender.com'

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        // Error de credenciales (401 o 403)
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            "Acceso denegado", 
            "El correo y/o la contraseña son erróneos. Si no tienes cuenta, ¡regístrate!"
          )
        } else {
          Alert.alert("Error", "Algo ha ido mal en el servidor. Inténtalo más tarde.")
        }
        return
      }

      // LOGIN EXITOSO
      const data = await response.json()
      console.log("Login correcto. Token recibido:", data.token)

      // TODO: Aquí podrías guardar el token en SecureStore
      
      // Navegación directa
      router.replace('/unirse')

    } catch (error) {
      console.error("Error en login:", error)
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Escudo */}
      <View style={[styles.shield, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}40` }]}>
        <Text style={{ fontSize: 28 }}>🛡️</Text>
      </View>

      {/* Header */}
      <Text style={[styles.title, { color: c.texto }]}>{t('login.title')}</Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('login.subtitle')}</Text>

      {/* Email */}
      <Text style={[styles.label, { color: c.subtexto }]}>{t('login.email')} *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
        placeholder={t('login.emailPlaceholder')}
        placeholderTextColor={c.subtexto}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      {/* Contraseña */}
      <Text style={[styles.label, { color: c.subtexto }]}>{t('login.password')} *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
          placeholder={t('login.passwordPlaceholder')}
          placeholderTextColor={c.subtexto}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.eyeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Olvidaste contraseña */}
      <TouchableOpacity 
        style={styles.forgotContainer} 
        onPress={() => router.push('/recuperar-password')}
        disabled={isLoading}
      >
        <Text style={[styles.forgotText, { color: c.boton }]}>{t('login.forgotPassword')}</Text>
      </TouchableOpacity>

      {/* Botón acceder */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isLoading ? c.bordeInput : c.boton }]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={c.botonTexto} />
        ) : (
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('login.button')}</Text>
        )}
      </TouchableOpacity>

      {/* Link registro */}
      <TouchableOpacity 
        style={styles.linkContainer} 
        onPress={() => router.push('/registro')}
        disabled={isLoading}
      >
        <Text style={{ color: c.subtexto }}>{t('login.noAccount')} </Text>
        <Text style={[styles.link, { color: c.boton }]}>{t('login.registerLink')}</Text>
      </TouchableOpacity>
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
    marginBottom: 32,
  },
  shield: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
  },
  eyeButton: {
    borderWidth: 1,
    borderRadius: 10,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
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
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    fontWeight: 'bold',
  },
})