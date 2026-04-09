import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next'; // Supongo que usas i18n por tus mensajes anteriores
import { useNavigation } from '@react-navigation/native';

export default function RecuperarPassword() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('forgotPassword.emailRequired') || 'El correo es obligatorio');
      return;
    }

    setLoading(true);
    try {
      // AQUÍ ESTÁ EL CAMBIO CLAVE DEL ROLLBACK: 
      // Volvemos a usar la URL de Expo Go. 
      // ¡Asegúrate de cambiar las XX por tu IP real!
      const urlRedireccion = 'https://squadra-reset-password.onrender.com';

      const response = await fetch('https://squadraapi.onrender.com/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          redirectTo: urlRedireccion 
        }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const errorData = await response.text();
        Alert.alert(t('common.error'), errorData || 'Error al solicitar el cambio de contraseña');
      }
    } catch (error) {
      console.error('Error en recuperación:', error);
      Alert.alert(t('common.error'), 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQUADRA</Text>
      
      {!sent ? (
        <>
          <Text style={styles.subtitle}>Recuperar Contraseña</Text>
          <Text style={styles.description}>
            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRecover}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Enviar Enlace</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>¡Correo enviado!</Text>
          <Text style={styles.description}>
            Revisa tu bandeja de entrada o la carpeta de Spam. Abre el enlace desde este mismo dispositivo para cambiar tu contraseña.
          </Text>
          <TouchableOpacity 
            style={styles.buttonSecondary} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>Volver al Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#379c6f', // Verde Squadra
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#379c6f', // Verde Squadra
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#2e835e',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 50,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    color: '#379c6f',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonSecondary: {
    marginTop: 20,
    padding: 15,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#379c6f',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#379c6f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});