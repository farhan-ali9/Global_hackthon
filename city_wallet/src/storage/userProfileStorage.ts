import * as SQLite from "expo-sqlite";

import type { OnboardingAnswer, UserProfile } from "@/src/types/city-wallet";

const DATABASE_NAME = "city-wallet.db";
const PROFILE_ID = "local-user";

type UserProfileRow = {
  id: string;
  displayName: string;
  answersJson: string;
  completedAtIso: string;
  updatedAtIso: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function saveUserProfile({
  displayName,
  answers,
}: {
  displayName: string;
  answers: OnboardingAnswer[];
}) {
  const now = new Date().toISOString();
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO user_profiles (id, displayName, answersJson, completedAtIso, updatedAtIso)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       displayName = excluded.displayName,
       answersJson = excluded.answersJson,
       completedAtIso = excluded.completedAtIso,
       updatedAtIso = excluded.updatedAtIso`,
    PROFILE_ID,
    displayName.trim(),
    JSON.stringify(answers),
    now,
    now,
  );
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    `SELECT id, displayName, answersJson, completedAtIso, updatedAtIso
     FROM user_profiles
     WHERE id = ?`,
    PROFILE_ID,
  );

  if (row === null) return null;
  const onboardingAnswers = parseAnswers(row.answersJson);

  return {
    id: row.id,
    displayName: getDisplayName(row.displayName, onboardingAnswers),
    onboardingAnswers,
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
      displayName TEXT NOT NULL DEFAULT '',
      answersJson TEXT NOT NULL,
      completedAtIso TEXT NOT NULL,
      updatedAtIso TEXT NOT NULL
    );
  `);

  await addColumnIfMissing(db, "user_profiles", "displayName", "TEXT NOT NULL DEFAULT ''");

  return db;
}

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  if (columns.some((column) => column.name === columnName)) return;

  await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
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

function getDisplayName(displayName: string, answers: OnboardingAnswer[]) {
  const storedDisplayName = displayName.trim();
  if (storedDisplayName.length > 0) return storedDisplayName;

  return (
    answers
      .find((answer) => answer.questionId === "name")
      ?.selectedOptions[0]?.label.trim() ?? ""
  );
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
