import * as ImagePicker from "expo-image-picker";
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
import {
  isEmpty,
  isValidDocument,
  isValidEmail,
  isValidPassword,
} from "../../lib/helper";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";
import LogoSimbolo from "../../components/LogoSimbolo";

type DocType = "DNI" | "NIE" | "PASSPORT";

const DOC_TYPES: { label: string; value: DocType }[] = [
  { label: "DNI", value: "DNI" },
  { label: "NIE", value: "NIE" },
  { label: "Passport", value: "PASSPORT" },
];

const DOC_PLACEHOLDER: Record<DocType, string> = {
  DNI: "12345678A",
  NIE: "X1234567A",
  PASSPORT: "AAB123456",
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getMimeType(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const ext = asset.uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export default function Register() {
  const c = useTheme();
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const themeMode = useAuthStore((s: any) => s.themeMode);
  const colorScheme = useColorScheme();
  const isDark = themeMode === "dark" || (themeMode === "auto" && colorScheme === "dark");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [docType, setDocType] = useState<DocType>("DNI");
  const [docNumber, setDocNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("register.permissionDeniedTitle"),
        t("register.permissionDeniedMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
      setPhotoAsset(result.assets[0]);
    }
  };

  const uploadPhoto = async (
    asset: ImagePicker.ImagePickerAsset,
  ): Promise<string> => {
    const mimeType = getMimeType(asset);

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Tipo de imagen no permitido: ${mimeType.split("/")[1].toUpperCase()}. Usa JPEG, PNG o WebP.`,
      );
    }

    // Leer como blob para subir y verificar tamaño real
    const fetchResponse = await fetch(asset.uri);
    const blob = await fetchResponse.blob();

    const size = asset.fileSize ?? blob.size;
    if (size > MAX_FILE_SIZE) {
      throw new Error(
        `La imagen pesa ${(size / 1024 / 1024).toFixed(1)} MB. El límite es 5 MB.`,
      );
    }

    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const filename = asset.fileName ?? `photo.${ext}`;
    const path = `${Date.now()}_${filename}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType: mimeType, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const validateFields = (): boolean => {
    if (isEmpty(firstName)) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorFirstName", "El nombre es obligatorio."),
      );
      return false;
    }
    if (isEmpty(lastName)) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorLastName", "Los apellidos son obligatorios."),
      );
      return false;
    }
    if (!isValidEmail(email)) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorEmail", "Por favor, introduce un email válido."),
      );
      return false;
    }
    if (isEmpty(phone)) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorPhone", "El teléfono es obligatorio."),
      );
      return false;
    }
    if (!isValidDocument(docType, docNumber)) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorDocument", {
          type: docType,
          defaultValue: "Documento no válido.",
        }),
      );
      return false;
    }
    if (!isValidPassword(password)) {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "register.errorPassword",
          "La contraseña debe tener al menos 6 caracteres.",
        ),
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        t("common.error", "Error"),
        t("register.errorConfirmPassword", "Las contraseñas no coinciden."),
      );
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    setIsLoading(true);

    try {
      let photoUrl = "";

      if (photoAsset) {
        setUploadLabel("Subiendo foto...");
        try {
          photoUrl = await uploadPhoto(photoAsset);
        } catch (uploadError: any) {
          Alert.alert(
            "Error con la imagen",
            uploadError.message ?? "No se pudo subir la imagen. Inténtalo de nuevo.",
          );
          return;
        }
        setUploadLabel("Creando cuenta...");
      }

      const payload = {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        docType,
        docNumber: docNumber.trim().toUpperCase(),
        photoUrl,
      };

      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "https://squadraapi.onrender.com";

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Alert.alert(
          "No se pudo completar",
          "Verifica que los datos sean correctos. Si ya tenías una cuenta creada, intenta iniciar sesión.",
        );
        return;
      }

      const data = await response.json();

      const userProfile = {
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        docType: data.docType,
        docNumber: data.docNumber,
        photoUrl: data.photoUrl,
      };
      setAuth(data.token, userProfile);

      clearFields();
      router.replace("/(selector)");
    } catch (error) {
      Alert.alert(
        "Error de conexión",
        "No hemos podido conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
      setUploadLabel("");
    }
  };

  const clearFields = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setDocNumber("");
    setDocType("DNI");
    setProfilePhoto(null);
    setPhotoAsset(null);
  };

  const mismatch = confirmPassword !== "" && confirmPassword !== password;

  return (
    <View style={[styles.root, { backgroundColor: c.fondo }]}>
      <LogoSimbolo size={700} color="#ffc06d" style={styles.watermark} />

      <ScrollView
        contentContainerStyle={styles.outer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>

          <View style={styles.brandBlock}>
            <LogoSimbolo size={60} color="#ffc06d" style={{ alignSelf: "center" }} />
            <Image
              source={
                isDark
                  ? require("../../assets/images/titulo-squadra-dark.png")
                  : require("../../assets/images/titulo-squadra.png")
              }
              style={styles.imgTitulo}
            />
          </View>

          <Text style={[styles.title, { color: c.texto }]}>
        {t("register.title")}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {t("register.subtitle")}
      </Text>

      <TouchableOpacity
        style={styles.photoContainer}
        onPress={pickPhoto}
        disabled={isLoading}
      >
        {profilePhoto ? (
          <Image
            source={{ uri: profilePhoto }}
            style={[styles.photo, { borderColor: c.boton }]}
          />
        ) : (
          <View
            style={[
              styles.photoEmpty,
              { backgroundColor: c.input, borderColor: c.bordeInput },
            ]}
          >
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={[styles.photoText, { color: c.subtexto }]}>
              {t("register.addPhoto")}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.photoEditBadge,
            { backgroundColor: c.boton, borderColor: c.fondo },
          ]}
        >
          <Text style={styles.photoEditIcon}>✏️</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.firstName")} *
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
        placeholder={t("register.firstNamePlaceholder")}
        placeholderTextColor={c.subtexto}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.lastName")} *
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
        placeholder={t("register.lastNamePlaceholder")}
        placeholderTextColor={c.subtexto}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.email")} *
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
        placeholder={t("register.emailPlaceholder")}
        placeholderTextColor={c.subtexto}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.phone")} *
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
        placeholder={t("register.phonePlaceholder")}
        placeholderTextColor={c.subtexto}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.docType")} *
      </Text>
      <View style={styles.radioGroup}>
        {DOC_TYPES.map((type) => {
          const active = docType === type.value;
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
                setDocType(type.value);
                setDocNumber("");
              }}
            >
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: active ? c.boton : c.bordeInput },
                ]}
              >
                {active && (
                  <View
                    style={[
                      styles.radioCircleFill,
                      { backgroundColor: c.boton },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.radioText,
                  { color: active ? c.boton : c.texto },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.docNumber", { type: docType })} *
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
        placeholder={DOC_PLACEHOLDER[docType]}
        placeholderTextColor={c.subtexto}
        value={docNumber}
        onChangeText={setDocNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.password")} *
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
        placeholder={t("register.passwordPlaceholder")}
        placeholderTextColor={c.subtexto}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        {t("register.confirmPassword")} *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.input,
            borderColor: mismatch ? "#ef4444" : c.bordeInput,
            color: c.texto,
          },
        ]}
        placeholder={t("register.confirmPasswordPlaceholder")}
        placeholderTextColor={c.subtexto}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
      />
      {mismatch && (
        <Text style={styles.errorText}>
          {t("register.errorConfirmPassword")}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isLoading ? c.bordeInput : c.boton },
        ]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={c.botonTexto} />
            {uploadLabel ? (
              <Text style={[styles.buttonText, { color: c.botonTexto }]}>
                {uploadLabel}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>
            {t("register.button")}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => router.replace("/login")}
        disabled={isLoading}
      >
        <Text style={{ color: c.subtexto }}>
          {t("register.alreadyAccount")}{" "}
        </Text>
        <Text style={[styles.link, { color: c.boton }]}>
          {t("register.loginLink")}
        </Text>
      </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -350 }, { translateY: -350 }],
    opacity: 0.06,
  },
  outer: { flexGrow: 1, justifyContent: "center" },
  formContainer: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  imgTitulo: {
    width: "55%",
    height: 36,
    resizeMode: "contain",
    alignSelf: "center",
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
  photoContainer: {
    alignSelf: "center",
    marginBottom: 32,
    position: "relative",
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
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoIcon: {
    fontSize: 24,
  },
  photoText: {
    fontSize: 11,
    fontWeight: "500",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  photoEditIcon: {
    fontSize: 12,
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
  radioGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioText: {
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
