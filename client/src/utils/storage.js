import { Preferences } from '@capacitor/preferences';

const AUTH_STORAGE_KEY = 'hw-auth';
const API_BASE_URL_STORAGE_KEY = 'hw-api-base-url';

export async function readStorage(key) {
  try {
    const { value } = await Preferences.get({ key });
    if (value !== null && value !== undefined) {
      return value;
    }
  } catch {
    // Fall back to localStorage when the plugin is unavailable.
  }

  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function writeStorage(key, value) {
  try {
    await Preferences.set({ key, value });
  } catch {
    // Keep localStorage in sync even if the plugin fails.
  }

  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignore storage write failures to avoid blocking login/logout flows.
  }
}

export async function removeStorage(key) {
  try {
    await Preferences.remove({ key });
  } catch {
    // Fall through to localStorage cleanup.
  }

  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export async function getStoredAuth() {
  const raw = await readStorage(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    await removeStorage(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function persistAuth(user, token) {
  await writeStorage(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
}

export async function clearStoredAuth() {
  await removeStorage(AUTH_STORAGE_KEY);
}

export async function getStoredApiBaseUrl() {
  const raw = await readStorage(API_BASE_URL_STORAGE_KEY);
  return raw?.trim() || '';
}

export async function persistApiBaseUrl(baseUrl) {
  await writeStorage(API_BASE_URL_STORAGE_KEY, baseUrl.trim());
}

export async function clearStoredApiBaseUrl() {
  await removeStorage(API_BASE_URL_STORAGE_KEY);
}
