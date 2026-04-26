import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { useRouter, type Href } from "expo-router";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveUserProfile } from "@/src/storage/userProfileStorage";
import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

/* ─────────────────────────────────────────────────────────────────
   Question definitions
   ───────────────────────────────────────────────────────────────── */

type Question = {
  id: string;
  icon: IoniconsName;
  title: string;
  subtitle: string;
  /** text = free-text input step; options = choice grid step */
  type?: "text" | "options";
  multi?: boolean;
  options?: { id: string; label: string; icon: IoniconsName }[];
};

const QUESTIONS: Question[] = [
  {
    id: "name",
    icon: "person-circle-outline",
    title: "What's your name?",
    subtitle: "We'll use it to personalise your experience",
    type: "text",
  },
  {
    id: "gender",
    icon: "person-outline",
    title: "How do you identify?",
    subtitle: "We use this to personalise your offers",
    multi: false,
    options: [
      { id: "male",      label: "Male",             icon: "male-outline" },
      { id: "female",    label: "Female",            icon: "female-outline" },
      { id: "nonbinary", label: "Non-binary",        icon: "transgender-outline" },
      { id: "other",     label: "Prefer not to say", icon: "lock-closed-outline" },
    ],
  },
  {
    id: "age",
    icon: "calendar-outline",
    title: "What's your age group?",
    subtitle: "Helps us show relevant local services",
    multi: false,
    options: [
      { id: "u18",   label: "Under 18", icon: "happy-outline" },
      { id: "18-25", label: "18 – 25",  icon: "person-outline" },
      { id: "26-35", label: "26 – 35",  icon: "person-outline" },
      { id: "36-50", label: "36 – 50",  icon: "person-outline" },
      { id: "50+",   label: "50+",      icon: "accessibility-outline" },
    ],
  },
  {
    id: "hobbies",
    icon: "grid-outline",
    title: "What are your hobbies?",
    subtitle: "Pick as many as you like",
    multi: true,
    options: [
      { id: "sports",   label: "Sports",   icon: "football-outline" },
      { id: "music",    label: "Music",    icon: "musical-notes-outline" },
      { id: "arts",     label: "Arts",     icon: "color-palette-outline" },
      { id: "gaming",   label: "Gaming",   icon: "game-controller-outline" },
      { id: "cooking",  label: "Cooking",  icon: "restaurant-outline" },
      { id: "travel",   label: "Travel",   icon: "airplane-outline" },
      { id: "reading",  label: "Reading",  icon: "book-outline" },
      { id: "outdoors", label: "Outdoors", icon: "leaf-outline" },
    ],
  },
  {
    id: "food",
    icon: "restaurant-outline",
    title: "Food preferences?",
    subtitle: "So we can show you the right restaurant deals",
    multi: true,
    options: [
      { id: "omnivore",   label: "No restrictions", icon: "checkmark-circle-outline" },
      { id: "vegetarian", label: "Vegetarian",       icon: "leaf-outline" },
      { id: "vegan",      label: "Vegan",            icon: "flower-outline" },
      { id: "glutenfree", label: "Gluten-free",      icon: "ban-outline" },
      { id: "halal",      label: "Halal",            icon: "star-outline" },
      { id: "kosher",     label: "Kosher",           icon: "shield-outline" },
    ],
  },
  {
    id: "transport",
    icon: "bus-outline",
    title: "How do you get around?",
    subtitle: "We'll highlight transit offers for your style",
    multi: true,
    options: [
      { id: "walk",    label: "Walking",        icon: "walk-outline" },
      { id: "bike",    label: "Cycling",        icon: "bicycle-outline" },
      { id: "transit", label: "Public transit", icon: "train-outline" },
      { id: "car",     label: "Car",            icon: "car-outline" },
      { id: "mixed",   label: "Mixed",          icon: "shuffle-outline" },
    ],
  },
  {
    id: "interests",
    icon: "bulb-outline",
    title: "What offers interest you most?",
    subtitle: "Pick your top categories",
    multi: true,
    options: [
      { id: "food_out",  label: "Food & Dining",  icon: "fast-food-outline" },
      { id: "fashion",   label: "Fashion",         icon: "shirt-outline" },
      { id: "entertain", label: "Entertainment",   icon: "film-outline" },
      { id: "wellness",  label: "Wellness",        icon: "heart-outline" },
      { id: "travel_d",  label: "Travel",          icon: "earth-outline" },
      { id: "tech",      label: "Tech & Gadgets",  icon: "phone-portrait-outline" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────── */

export default function OnboardingQuestionnaire() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [name, setName]       = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Animated progress bar width (0→1)
  const progressAnim = useRef(new Animated.Value(1 / QUESTIONS.length)).current; // QUESTIONS.length now includes name step
  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q        = QUESTIONS[step];
  const selected = answers[q.id] ?? [];
  const isLast   = step === QUESTIONS.length - 1;
  const isNameStep = q.type === "text";
  const canNext  = isNameStep ? name.trim().length > 0 : selected.length > 0;

  function animateToStep(nextStep: number, direction: 1 | -1) {
    // Slide out current
    Animated.timing(slideAnim, {
      toValue: -direction * 40,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * 40);
      // Slide in next
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: (nextStep + 1) / QUESTIONS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }

  function toggleOption(optId: string) {
    if (isNameStep) return;
    const prev = answers[q.id] ?? [];
    let next: string[];
    if (q.multi) {
      next = prev.includes(optId) ? prev.filter((x) => x !== optId) : [...prev, optId];
    } else {
      next = [optId];
    }
    setAnswers({ ...answers, [q.id]: next });
  }

  async function handleNext() {
    if (!canNext) return;
    if (isLast) {
      setIsSaving(true);
      try {
        await saveUserProfile(
          QUESTIONS.map((question) => {
            if (question.type === "text") {
              return {
                questionId: question.id,
                questionTitle: question.title,
                selectedOptions: [{ id: question.id, label: name.trim() }],
              };
            }
            return {
              questionId: question.id,
              questionTitle: question.title,
              selectedOptions: (answers[question.id] ?? []).map((optionId) => {
                const option = question.options?.find((candidate) => candidate.id === optionId);
                return {
                  id: optionId,
                  label: option?.label ?? optionId,
                };
              }),
            };
          }),
        );
        router.replace("/(tabs)" as Href);
      } finally {
        setIsSaving(false);
      }
    } else {
      animateToStep(step + 1, 1);
    }
  }

  function handleBack() {
    if (step === 0) {
      router.back();
    } else {
      animateToStep(step - 1, -1);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={20} color={CW.text} />
        </Pressable>

        <Text style={styles.stepLabel}>{step + 1} of {QUESTIONS.length}</Text>

        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace("/(tabs)" as Href)}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {/* ── Question ── */}
      <Animated.View
        style={[
          styles.questionContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Icon + heading */}
        <View style={styles.questionHeader}>
          <View style={styles.questionIconWrap}>
            <Ionicons name={q.icon} size={28} color={CW.text} />
          </View>
          <Text style={styles.questionTitle}>{q.title}</Text>
          <Text style={styles.questionSub}>{q.subtitle}</Text>
          {q.multi && (
            <View style={styles.multiBadge}>
              <Text style={styles.multiBadgeText}>Multiple choice</Text>
            </View>
          )}
        </View>

        {/* Name input — step 0 only */}
        {isNameStep ? (
          <View style={styles.nameInputWrap}>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Sofia"
              placeholderTextColor={CW.soft}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleNext}
              maxLength={40}
            />
            {name.trim().length > 0 && (
              <View style={styles.namePreview}>
                <Text style={styles.namePreviewText}>
                  Nice to meet you, {name.trim()} 👋
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Options grid */
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsGrid}
            showsVerticalScrollIndicator={false}
          >
            {(q.options ?? []).map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [
                    styles.optionTile,
                    isSelected && styles.optionTileSelected,
                    pressed && styles.optionTilePressed,
                  ]}
                  onPress={() => toggleOption(opt.id)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? "#fff" : CW.text}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkDot}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Next / Finish button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            (!canNext || isSaving) && styles.nextBtnDisabled,
            pressed && canNext && !isSaving && styles.nextBtnPressed,
          ]}
          onPress={handleNext}
          disabled={!canNext || isSaving}
        >
          <Text style={styles.nextBtnText}>
            {isSaving ? "Saving..." : isLast ? "Get started →" : "Continue →"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bg },

  /* top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CW.bgAlt,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: 13,
    color: CW.soft,
    fontFamily: fontFamily.medium,
  },
  skipBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  skipText: {
    fontSize: 13,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    textDecorationLine: "underline",
  },

  /* progress */
  progressTrack: {
    height: 4,
    backgroundColor: CW.border,
    marginHorizontal: 18,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: CW.text,
    borderRadius: 2,
  },

  /* question */
  questionContainer: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  questionHeader: {
    marginBottom: 22,
  },
  questionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: CW.bgAlt,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: CW.text,
    letterSpacing: -0.8,
    lineHeight: 32,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },
  questionSub: {
    fontSize: 14,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  multiBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: CW.bgAlt,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: CW.border,
  },
  multiBadgeText: {
    fontSize: 10,
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  /* options */
  optionsScroll: { flex: 1 },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 16,
  },
  optionTile: {
    width: "47%",
    backgroundColor: CW.bgAlt,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CW.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    position: "relative",
  },
  optionTileSelected: {
    backgroundColor: CW.text,
    borderColor: CW.text,
  },
  optionTilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  optionIcon: {
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: CW.text,
    fontFamily: fontFamily.medium,
  },
  optionLabelSelected: {
    color: "#fff",
  },
  checkDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* name input step */
  nameInputWrap: {
    flex: 1,
    paddingTop: 8,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: "300",
    color: CW.text,
    fontFamily: fontFamily.regular,
    borderBottomWidth: 2,
    borderBottomColor: CW.text,
    paddingVertical: 12,
    paddingHorizontal: 2,
    letterSpacing: -0.5,
  },
  namePreview: {
    marginTop: 20,
    backgroundColor: CW.bgAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: CW.border,
  },
  namePreviewText: {
    fontSize: 15,
    color: CW.text,
    fontFamily: fontFamily.medium,
  },

  /* footer */
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: CW.bg,
    borderTopWidth: 1,
    borderTopColor: CW.border,
  },
  nextBtn: {
    backgroundColor: CW.text,
    borderRadius: CW.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnDisabled: {
    backgroundColor: CW.border,
  },
  nextBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.2,
  },
});
