import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 🟢 IMPORTACIONES CRUCIALES
import { isEmpty, isValidEmail } from "../../lib/helper";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/useTheme";
import { useAuthStore } from "../../lib/store"; // 👈 Esta es la ruta correcta según tu PC

export default function Login() {
  const c = useTheme();
  const { t } = useTranslation();

  // Accedemos a la función del store para guardar la sesión
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // VALIDACIÓN LOCAL
  const validateFields = (): boolean => {
    if (!isValidEmail(email)) {
      Alert.alert(
        t("common.error", "Error"),
        t("login.errorEmail", "Introduce un email válido.")
      );
      return false;
    }
    if (isEmpty(password)) {
      Alert.alert(
        t("common.error", "Error"),
        t("login.errorPassword", "La contraseña es obligatoria.")
      );
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;
    setIsLoading(true);

    try {
      // 1. Intentamos el login en Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        Alert.alert(
          "Acceso denegado",
          "El correo y/o la contraseña son erróneos."
        );
        return;
      }

      // 2. Si el login es correcto, actualizamos el Store Global
      if (data?.user && data?.session) {
        console.log("✅ Login exitoso en Supabase");
        
        // Esto hace que el estado global cambie y el Layout lo detecte
        setAuth(data.user, data.session);
        
        // NOTA: No hace falta router.replace aquí porque tu _layout.tsx 
        // probablemente ya escucha el cambio de sesión y redirige solo.
      }
    } catch (err) {
      console.error("Error inesperado en login:", err);
      Alert.alert("Error", "Ocurrió un fallo inesperado al intentar entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Escudo */}
      <View
        style={[
          styles.shield,
          { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}40` },
        ]}
      >
        <Text style={{ fontSize: 28 }}>🛡️</Text>
      </View>

      {/* Header */}
      <Text style={[styles.title, { color: c.texto }]}>{t("login.title", "Bienvenido")}</Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {t("login.subtitle", "Entra en tu zona de juego")}
      </Text>

      {/* Email */}
      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("login.email", "Email")} *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.input,
            borderColor: c.bordeInput,
            color: c.texto,
          },
        ]}
        placeholder={t("login.emailPlaceholder", "ejemplo@squadra.com")}
        placeholderTextColor={c.subtexto}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      {/* Contraseña */}
      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("login.password", "Contraseña")} *
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            {
              backgroundColor: c.input,
              borderColor: c.bordeInput,
              color: c.texto,
            },
          ]}
          placeholder={t("login.passwordPlaceholder", "••••••••")}
          placeholderTextColor={c.subtexto}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.eyeButton,
            { backgroundColor: c.input, borderColor: c.bordeInput },
          ]}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Olvidaste contraseña */}
      <TouchableOpacity
        style={styles.forgotContainer}
        onPress={() => router.push("/recuperar-password")}
        disabled={isLoading}
      >
        <Text style={[styles.forgotText, { color: c.boton }]}>
          {t("login.forgotPassword", "¿Olvidaste tu contraseña?")}
        </Text>
      </TouchableOpacity>

      {/* Botón acceder */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isLoading ? c.bordeInput : c.boton },
        ]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={c.botonTexto} />
        ) : (
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>
            {t("login.button", "Acceder")}
          </Text>
        )}
      </TouchableOpacity>

      {/* Link registro */}
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => router.push("/registro")}
        disabled={isLoading}
      >
        <Text style={{ color: c.subtexto }}>{t("login.noAccount", "¿No tienes cuenta?")} </Text>
        <Text style={[styles.link, { color: c.boton }]}>
          {t("login.registerLink", "Regístrate aquí")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
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
    fontWeight: "bold",
    color: "#C9A84C",
    letterSpacing: 4,
    marginBottom: 32,
  },
  shield: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
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
    flexDirection: "row",
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
    alignItems: "center",
    justifyContent: "center",
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "500",
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    fontWeight: "bold",
  },
});