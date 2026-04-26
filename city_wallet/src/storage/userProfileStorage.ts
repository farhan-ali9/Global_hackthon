import * as SQLite from "expo-sqlite";

import type { OnboardingAnswer, UserProfile } from "@/src/types/city-wallet";

const DATABASE_NAME = "city-wallet.db";
const PROFILE_ID = "local-user";

type UserProfileRow = {
  id: string;
  answersJson: string;
  completedAtIso: string;
  updatedAtIso: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function saveUserProfile(answers: OnboardingAnswer[]) {
  const now = new Date().toISOString();
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO user_profiles (id, answersJson, completedAtIso, updatedAtIso)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       answersJson = excluded.answersJson,
       completedAtIso = excluded.completedAtIso,
       updatedAtIso = excluded.updatedAtIso`,
    PROFILE_ID,
    JSON.stringify(answers),
    now,
    now,
  );
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    `SELECT id, answersJson, completedAtIso, updatedAtIso
     FROM user_profiles
     WHERE id = ?`,
    PROFILE_ID,
  );

  if (row === null) return null;

  return {
    id: row.id,
    onboardingAnswers: parseAnswers(row.answersJson),
    completedAtIso: row.completedAtIso,
    updatedAtIso: row.updatedAtIso,
  };
}

async function getDatabase() {
  databasePromise ??= openAndMigrateDatabase();
  return databasePromise;
}

async function openAndMigrateDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      answersJson TEXT NOT NULL,
      completedAtIso TEXT NOT NULL,
      updatedAtIso TEXT NOT NULL
    );
  `);

  return db;
}

function parseAnswers(answersJson: string): OnboardingAnswer[] {
  try {
    const parsed: unknown = JSON.parse(answersJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isOnboardingAnswer);
  } catch {
    return [];
  }
}

function isOnboardingAnswer(value: unknown): value is OnboardingAnswer {
  if (typeof value !== "object" || value === null) return false;

  const answer = value as Partial<OnboardingAnswer>;

  return (
    typeof answer.questionId === "string" &&
    typeof answer.questionTitle === "string" &&
    Array.isArray(answer.selectedOptions) &&
    answer.selectedOptions.every(isSelectedOption)
  );
}

function isSelectedOption(value: unknown) {
  if (typeof value !== "object" || value === null) return false;

  const option = value as { id?: unknown; label?: unknown };

  return typeof option.id === "string" && typeof option.label === "string";
}
