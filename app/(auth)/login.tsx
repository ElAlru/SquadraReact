import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { isEmpty, isValidEmail } from "../../lib/helper";
import { useAuthStore } from "../../lib/store";
import LogoSimbolo from "../../components/LogoSimbolo";

export default function Login() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const themeMode = useAuthStore((s: any) => s.themeMode);
  const colorScheme = useColorScheme();

  // Resuelve si el tema activo es oscuro (respeta modo 'auto' del dispositivo)
  const isDark = themeMode === "dark" || (themeMode === "auto" && colorScheme === "dark");

  // Colores básicos derivados del tema
  const fondo      = isDark ? "#1a1a1a" : "#ffffff";
  const texto      = isDark ? "#f1f5f9" : "#111827";
  const subtexto   = isDark ? "#94a3b8" : "#6b7280";
  const input      = isDark ? "#27272a" : "#f9fafb";
  const bordeInput = isDark ? "#3f3f46" : "#e5e7eb";
  const boton      = "#16a34a";
  const botonTexto = "#ffffff";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateFields = (): boolean => {
    if (!isValidEmail(email)) {
      Alert.alert(
        t("common.error", "Error"),
        t("login.errorEmail", "Introduce un email válido."),
      );
      return false;
    }
    if (isEmpty(password)) {
      Alert.alert(
        t("common.error", "Error"),
        t("login.errorPassword", "La contraseña es obligatoria."),
      );
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;
    setIsLoading(true);

    try {
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "https://squadraapi.onrender.com";

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        setIsLoading(false);
        Alert.alert(
          "Acceso denegado",
          "El correo y/o la contraseña son erróneos.",
        );
        return;
      }

      const data = await response.json();

      setAuth(data.token, {
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        docType: data.docType,
        docNumber: data.docNumber,
        photoUrl: data.photoUrl,
      });
    } catch (err) {
      console.error("Error inesperado en login:", err);
      Alert.alert(
        "Error de conexión",
        "No hemos podido conectar con el servidor.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: fondo }]}>
      {/* Marca de agua centrada en pantalla */}
      <LogoSimbolo
        size={700}
        color="#ffc06d"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -350 }, { translateY: -350 }],
          opacity: 0.06,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.outer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>

          {/* Logo + títulos */}
          <LogoSimbolo size={80} color="#ffc06d" style={styles.logo} />

          <Image
            source={
              isDark
                ? require("../../assets/images/titulo-squadra-dark.png")
                : require("../../assets/images/titulo-squadra.png")
            }
            style={styles.imgTitulo}
          />

          <Image
            source={
              isDark
                ? require("../../assets/images/subtitulo-squadra-dark.png")
                : require("../../assets/images/subtitulo-squadra.png")
            }
            style={styles.imgSubtitulo}
          />

          {/* Email */}
          <Text style={[styles.label, { color: subtexto }]}>
            {t("login.email", "Email")} *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: input, borderColor: bordeInput, color: texto }]}
            placeholder={t("login.emailPlaceholder", "ejemplo@squadra.com")}
            placeholderTextColor={subtexto}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          {/* Contraseña */}
          <Text style={[styles.label, { color: subtexto }]}>
            {t("login.password", "Contraseña")} *
          </Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: input, borderColor: bordeInput, color: texto }]}
              placeholder={t("login.passwordPlaceholder", "••••••••")}
              placeholderTextColor={subtexto}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: input, borderColor: bordeInput }]}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* ¿Olvidaste tu contraseña? */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => router.push("/recuperar-password")}
            disabled={isLoading}
          >
            <Text style={[styles.forgotText, { color: boton }]}>
              {t("login.forgotPassword", "¿Olvidaste tu contraseña?")}
            </Text>
          </TouchableOpacity>

          {/* Acceder */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isLoading ? bordeInput : boton }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={botonTexto} />
            ) : (
              <Text style={[styles.buttonText, { color: botonTexto }]}>
                {t("login.button", "Acceder")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Registro */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push("/registro")}
            disabled={isLoading}
          >
            <Text style={{ color: subtexto }}>
              {t("login.noAccount", "¿No tienes cuenta?")}{" "}
            </Text>
            <Text style={[styles.link, { color: boton }]}>
              {t("login.registerLink", "Regístrate aquí")}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  outer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    alignSelf: "center",
    marginBottom: 8,
  },
  imgTitulo: {
    width: '55%',
    height: 40,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 4,
  },
  imgSubtitulo: {
    width: '65%',
    height: 30,
    resizeMode: "contain",
    alignSelf: "center",
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
  passwordRow: {
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
