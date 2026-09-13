import AsyncStorage from "@react-native-async-storage/async-storage";
import { freshPreferences, parseStored, validatePreferences, type Preferences } from "./preferences";
export type { Preferences } from "./preferences";
const STORAGE_KEY = "@macromize/preferences.v1";

// Serialize reads and writes. Each operation receives its own rejection; a failed write cannot poison the queue.
let storageQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const pending = storageQueue.then(operation, operation);
  storageQueue = pending.catch(() => undefined);
  return pending;
}

async function readRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error("Your saved preferences are temporarily unavailable. Please try again. Your stored data has been kept unchanged.");
  }
}

/** Loads device-local preferences. No record returns fresh defaults. Malformed data rejects and is never rewritten. */
export function loadPreferences(): Promise<Preferences> {
  return enqueue(async () => {
    const raw = await readRaw();
    return raw === null ? freshPreferences() : parseStored(raw);
  });
}

/** Saves a snapshot on this device only. Rejects invalid input or unreadable existing data without overwriting it. */
export async function savePreferences(preferences: Preferences): Promise<void> {
  // Validate/copy at invocation time so caller mutations cannot change a queued write.
  const clean = validatePreferences(preferences);
  const encoded = JSON.stringify({ version: 1, ...clean });
  return enqueue(async () => {
    const existing = await readRaw();
    if (existing !== null) parseStored(existing);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, encoded);
    } catch {
      throw new Error("Your changes could not be saved on this device. Please try again.");
    }
  });
}
