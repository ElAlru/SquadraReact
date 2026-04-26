import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import LogoSimbolo from "../../components/LogoSimbolo";
import { isEmpty, isValidEmail } from "../../lib/helper";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

export default function Login() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const c = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

 const validateFields = (): boolean => {
    setErrorMessage(""); // Limpiamos errores previos
    if (!isValidEmail(email)) {
      setErrorMessage(t("login.errorEmail", "Introduce un formato de email válido (ej: correo@dominio.com)"));
      return false;
    }
    if (isEmpty(password)) {
      setErrorMessage(t("login.errorPassword", "La contraseña es obligatoria."));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;
    
    setIsLoading(true);
    setErrorMessage(""); // Limpiamos por si había un error previo antes de llamar a la API

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://squadraapi.onrender.com";
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        setIsLoading(false);
        const errorText = await response.text();
        setErrorMessage(errorText || "Las credenciales son incorrectas. Revisa tu email y contraseña.");
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
      setErrorMessage("No hemos podido conectar con el servidor. Revisa tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.fondo }]}>
      <LogoSimbolo
        size={700}
        color={c.colorMarca}
        style={[styles.watermark, { opacity: c.marcaAguaOpacity }]}
      />

      <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          
          <LogoSimbolo size={80} color={c.colorMarca} style={styles.logo} />
          
          <View style={styles.headerTextContainer}>
            <Text style={[styles.tituloTexto, { color: c.colorMarca }]}>SQUADRA</Text>
            <Text style={[styles.subtituloTexto, { color: c.colorMarca }]}>DONDE NACE EL FÚTBOL</Text>
          </View>

          <Text style={[styles.label, { color: c.subtexto }]}>{t("login.email", "Email")} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            placeholder={t("login.emailPlaceholder", "ejemplo@squadra.com")}
            placeholderTextColor={c.subtexto}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Text style={[styles.label, { color: c.subtexto }]}>{t("login.password", "Contraseña")} *</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.passwordInput, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder={t("login.passwordPlaceholder", "••••••••")}
              placeholderTextColor={c.subtexto}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotContainer} onPress={() => router.push("/recuperar-password")} disabled={isLoading}>
            <Text style={[styles.forgotText, { color: c.boton }]}>{t("login.forgotPassword", "¿Olvidaste tu contraseña?")}</Text>
          </TouchableOpacity>
          
          {/* BANNER DE ERROR (Se muestra solo si errorMessage tiene texto) */}
          {errorMessage !== "" && (
            <View style={[styles.errorBanner, { backgroundColor: `${c.error}15`, borderColor: c.error }]}>
              <Text style={{ color: c.error, fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                ⚠️ {errorMessage}
              </Text>
            </View>
          )}
          <TouchableOpacity style={[styles.button, { backgroundColor: isLoading ? c.bordeInput : c.boton }]} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={c.botonTexto} /> : <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t("login.button", "Acceder")}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer} onPress={() => router.push("/registro")} disabled={isLoading}>
            <Text style={{ color: c.subtexto }}>{t("login.noAccount", "¿No tienes cuenta?")} </Text>
            <Text style={[styles.link, { color: c.boton }]}>{t("login.registerLink", "Regístrate aquí")}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  watermark: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -350 }, { translateY: -350 }] },
  outer: { flexGrow: 1, justifyContent: "center" },
  formContainer: { maxWidth: 420, width: "100%", alignSelf: "center", paddingHorizontal: 24, paddingVertical: 32 },
  logo: { alignSelf: "center", marginBottom: 8 },
  headerTextContainer: { alignItems: 'center', marginBottom: 32 },
  tituloTexto: { fontFamily: 'SquadraStencil', fontSize: 48, textAlign: "center", letterSpacing: 2, lineHeight: 52 },
  subtituloTexto: { fontFamily: 'SquadraStencil', fontSize: 14, textAlign: "center", letterSpacing: 4, marginTop: -5, opacity: 0.9 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, marginBottom: 16, fontSize: 15 },
  passwordRow: { flexDirection: "row", marginBottom: 8, gap: 8 },
  passwordInput: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 15 },
  eyeButton: { borderWidth: 1, borderRadius: 10, width: 48, alignItems: "center", justifyContent: "center" },
  forgotContainer: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontSize: 13, fontWeight: "500" },
  button: { padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 16 },
  buttonText: { fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
  linkContainer: { flexDirection: "row", justifyContent: "center" },
  link: { fontWeight: "bold" },
  errorBanner: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
});