import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_AVATAR_COLOR,
  getPersonalInfo,
  savePersonalInfo,
} from "@/src/storage/userProfileStorage";
import { CW, fontFamily } from "@/src/theme/tokens";
import type { PersonalInfo } from "@/src/types/city-wallet";

const AVATAR_COLORS = [
  "#c5a880",
  "#7c9ecf",
  "#5ba878",
  "#e07070",
  "#9370bb",
  "#6bb8b8",
  "#e0945a",
  "#6e8fc9",
];

export default function PersonalInformationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  const [name,        setName]        = useState("");
  const [city,        setCity]        = useState("");
  const [bio,         setBio]         = useState("");
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR);

  const cityRef = useRef<TextInput>(null);
  const bioRef  = useRef<TextInput>(null);

  useEffect(() => {
    void getPersonalInfo().then((info) => {
      if (info) {
        setName(info.name);
        setCity(info.city);
        setBio(info.bio);
        setAvatarColor(info.avatarColor);
      }
      setLoading(false);
    });
  }, []);

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const hasChanges = !loading;

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSaving(true);
    const info: PersonalInfo = {
      name: name.trim(),
      city: city.trim(),
      bio: bio.trim(),
      avatarColor,
    };
    try {
      await savePersonalInfo(info);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save your profile. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, styles.center]}>
        <ActivityIndicator size="large" color={CW.soft} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={CW.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.avatarHint}>Choose avatar colour</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  avatarColor === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setAvatarColor(c)}
              >
                {avatarColor === c && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Form ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Basic</Text>
          <View style={styles.fieldGroup}>
            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <View style={[styles.fieldIcon, { backgroundColor: "#eef3ff" }]}>
                <Ionicons name="person-outline" size={16} color="#3355cc" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={CW.soft}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                  maxLength={60}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: "#e8f5ee" }]}>
                <Ionicons name="location-outline" size={16} color="#2d6a4f" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>City / Location</Text>
                <TextInput
                  ref={cityRef}
                  style={styles.fieldInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Linz, Austria"
                  placeholderTextColor={CW.soft}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => bioRef.current?.focus()}
                  maxLength={80}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: "#fff5e6" }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#cc7700" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Short bio</Text>
                <TextInput
                  ref={bioRef}
                  style={[styles.fieldInput, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="A few words about yourself…"
                  placeholderTextColor={CW.soft}
                  multiline
                  maxLength={200}
                  returnKeyType="done"
                />
                <Text style={styles.charCount}>{bio.length}/200</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Member since info (read-only) ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.fieldGroup}>
            <View style={[styles.fieldRow, styles.fieldBorder]}>
              <View style={[styles.fieldIcon, { backgroundColor: "#f0f0f5" }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={CW.mid} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Account ID</Text>
                <Text style={styles.fieldReadOnly}>local-user</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: "#f0f0f5" }]}>
                <Ionicons name="calendar-outline" size={16} color={CW.mid} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Member since</Text>
                <Text style={styles.fieldReadOnly}>2022</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },
  center: { alignItems: "center", justifyContent: "center" },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: CW.bg,
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CW.bgAlt,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.3,
  },
  saveBtn: {
    backgroundColor: CW.text,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: CW.pill,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: CW.border },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    fontFamily: fontFamily.semibold,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 20, gap: 20 },

  /* avatar */
  avatarSection: {
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    fontFamily: fontFamily.bold,
  },
  avatarHint: {
    fontSize: 12,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: CW.text,
  },

  /* form */
  formSection: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    paddingLeft: 2,
  },
  fieldGroup: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  fieldContent: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 15,
    color: CW.text,
    fontFamily: fontFamily.regular,
    padding: 0,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 10,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    textAlign: "right",
    marginTop: 4,
  },
  fieldReadOnly: {
    fontSize: 15,
    color: CW.soft,
    fontFamily: fontFamily.regular,
  },
});
