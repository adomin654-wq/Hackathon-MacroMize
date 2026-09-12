import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaults, validateTargets, type Targets } from "./domain";
import { emptyActivity, validateActivity, type Activity } from './activity';

export type Preferences = { targets: Targets; saved: string[]; activity: Activity };

const STORAGE_KEY = "@macromize/preferences.v1";
const unreadableMessage = "Your saved preferences could not be read. The stored data has been kept unchanged. Please try again before saving changes.";

function validatePreferences(input: unknown): Preferences {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Your saved preferences are not in the expected format.");
  }
  const candidate = input as Record<string, unknown>;
  if (!Array.isArray(candidate.saved)
    || candidate.saved.some((id) => typeof id !== "string" || !id.trim() || id.length > 512)) {
    throw new Error("Your saved meal list could not be read.");
  }
  return {
    targets: validateTargets(candidate.targets),
    saved: [...new Set(candidate.saved as string[])],
    activity: validateActivity(candidate.activity),
  };
}

function parseStored(raw: string): Preferences {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)
      || (parsed as Record<string, unknown>).version !== 1) throw new Error("Unsupported storage version");
    return validatePreferences(parsed);
  } catch {
    throw new Error(unreadableMessage);
  }
}

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
    return raw === null ? { targets: validateTargets(defaults), saved: [], activity: emptyActivity() } : parseStored(raw);
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
