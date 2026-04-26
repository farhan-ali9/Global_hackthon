import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

/* ─────────────────────────────────────────────────────────────────
   Question definitions
   ───────────────────────────────────────────────────────────────── */

type Question = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  multi: boolean;       // allow multiple selections
  options: { id: string; label: string; emoji: string }[];
};

const QUESTIONS: Question[] = [
  {
    id: "gender",
    emoji: "👤",
    title: "How do you identify?",
    subtitle: "We use this to personalise your offers",
    multi: false,
    options: [
      { id: "male",      label: "Male",            emoji: "♂️" },
      { id: "female",    label: "Female",           emoji: "♀️" },
      { id: "nonbinary", label: "Non-binary",       emoji: "⚧️" },
      { id: "other",     label: "Prefer not to say", emoji: "🤐" },
    ],
  },
  {
    id: "age",
    emoji: "🎂",
    title: "What's your age group?",
    subtitle: "Helps us show relevant local services",
    multi: false,
    options: [
      { id: "u18",   label: "Under 18", emoji: "🧒" },
      { id: "18-25", label: "18 – 25",  emoji: "🧑" },
      { id: "26-35", label: "26 – 35",  emoji: "👨" },
      { id: "36-50", label: "36 – 50",  emoji: "🧔" },
      { id: "50+",   label: "50+",      emoji: "👴" },
    ],
  },
  {
    id: "hobbies",
    emoji: "🎯",
    title: "What are your hobbies?",
    subtitle: "Pick as many as you like",
    multi: true,
    options: [
      { id: "sports",   label: "Sports",   emoji: "⚽" },
      { id: "music",    label: "Music",    emoji: "🎵" },
      { id: "arts",     label: "Arts",     emoji: "🎨" },
      { id: "gaming",   label: "Gaming",   emoji: "🎮" },
      { id: "cooking",  label: "Cooking",  emoji: "🍳" },
      { id: "travel",   label: "Travel",   emoji: "✈️" },
      { id: "reading",  label: "Reading",  emoji: "📚" },
      { id: "outdoors", label: "Outdoors", emoji: "🌲" },
    ],
  },
  {
    id: "food",
    emoji: "🍽️",
    title: "Food preferences?",
    subtitle: "So we can show you the right restaurant deals",
    multi: true,
    options: [
      { id: "omnivore",    label: "No restrictions", emoji: "🍖" },
      { id: "vegetarian",  label: "Vegetarian",      emoji: "🥗" },
      { id: "vegan",       label: "Vegan",            emoji: "🌱" },
      { id: "glutenfree",  label: "Gluten-free",      emoji: "🌾" },
      { id: "halal",       label: "Halal",            emoji: "☪️" },
      { id: "kosher",      label: "Kosher",           emoji: "✡️" },
    ],
  },
  {
    id: "transport",
    emoji: "🚌",
    title: "How do you get around?",
    subtitle: "We'll highlight transit offers for your style",
    multi: false,
    options: [
      { id: "walk",    label: "Walking",        emoji: "🚶" },
      { id: "bike",    label: "Cycling",        emoji: "🚴" },
      { id: "transit", label: "Public transit", emoji: "🚇" },
      { id: "car",     label: "Car",            emoji: "🚗" },
      { id: "mixed",   label: "Mixed",          emoji: "🔀" },
    ],
  },
  {
    id: "interests",
    emoji: "💡",
    title: "What offers interest you most?",
    subtitle: "Pick your top categories",
    multi: true,
    options: [
      { id: "food_out",   label: "Food & Dining",  emoji: "🍔" },
      { id: "fashion",    label: "Fashion",         emoji: "👗" },
      { id: "entertain",  label: "Entertainment",   emoji: "🎬" },
      { id: "wellness",   label: "Wellness",        emoji: "🧘" },
      { id: "travel_d",   label: "Travel",          emoji: "🌍" },
      { id: "tech",       label: "Tech & Gadgets",  emoji: "📱" },
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

  // Animated progress bar width (0→1)
  const progressAnim = useRef(new Animated.Value(1 / QUESTIONS.length)).current;
  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q = QUESTIONS[step];
  const selected = answers[q.id] ?? [];
  const isLast   = step === QUESTIONS.length - 1;
  const canNext  = selected.length > 0;

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
    const prev = answers[q.id] ?? [];
    let next: string[];
    if (q.multi) {
      next = prev.includes(optId) ? prev.filter((x) => x !== optId) : [...prev, optId];
    } else {
      next = [optId];
    }
    setAnswers({ ...answers, [q.id]: next });
  }

  function handleNext() {
    if (!canNext) return;
    if (isLast) {
      // Save answers and go to home
      // In a real app: persist answers to storage/backend here
      router.replace("/(tabs)" as Href);
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
        {/* Emoji + heading */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionEmoji}>{q.emoji}</Text>
          <Text style={styles.questionTitle}>{q.title}</Text>
          <Text style={styles.questionSub}>{q.subtitle}</Text>
          {q.multi && (
            <View style={styles.multiBadge}>
              <Text style={styles.multiBadgeText}>Multiple choice</Text>
            </View>
          )}
        </View>

        {/* Options grid */}
        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsGrid}
          showsVerticalScrollIndicator={false}
        >
          {q.options.map((opt) => {
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
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
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
      </Animated.View>

      {/* ── Next / Finish button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            !canNext && styles.nextBtnDisabled,
            pressed && canNext && styles.nextBtnPressed,
          ]}
          onPress={handleNext}
          disabled={!canNext}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "Get started →" : "Continue →"}
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
  questionEmoji: {
    fontSize: 38,
    marginBottom: 10,
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
  optionEmoji: {
    fontSize: 24,
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
