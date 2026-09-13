import { validateProfile, type PersonalProfile } from "./personal-profile.ts";
import { defaults, validateTargets, type Targets } from "./domain.ts";
import { emptyActivity, validateActivity, type Activity } from "./activity.ts";
export type Preferences = { profile?: PersonalProfile | null; targets: Targets; saved: string[]; activity: Activity; onboardingCompleted: boolean };


const unreadableMessage = "Your saved preferences could not be read. The stored data has been kept unchanged. Please try again before saving changes.";

export function validatePreferences(input: unknown): Preferences {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Your saved preferences are not in the expected format.");
  }
  const candidate = input as Record<string, unknown>;
  if (!Array.isArray(candidate.saved)
    || candidate.saved.some((id) => typeof id !== "string" || !id.trim() || id.length > 512)) {
    throw new Error("Your saved meal list could not be read.");
  }
  if (candidate.onboardingCompleted !== undefined && typeof candidate.onboardingCompleted !== "boolean") throw new Error("Invalid onboarding status");
  return {
    profile: validateProfile(candidate.profile),
    onboardingCompleted: candidate.onboardingCompleted === undefined ? true : candidate.onboardingCompleted,
    targets: validateTargets(candidate.targets),
    saved: [...new Set(candidate.saved as string[])],
    activity: validateActivity(candidate.activity),
  };
}

export function parseStored(raw: string): Preferences {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)
      || (parsed as Record<string, unknown>).version !== 1) throw new Error("Unsupported storage version");
    return validatePreferences(parsed);
  } catch {
    throw new Error(unreadableMessage);
  }
}


export function freshPreferences(): Preferences { return { profile: null, targets: validateTargets(defaults), saved: [], activity: emptyActivity(), onboardingCompleted: false }; }
