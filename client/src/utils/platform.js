import { Capacitor } from '@capacitor/core';

const NATIVE_PROTOCOLS = new Set(['capacitor:', 'ionic:', 'app:']);

export function isNativeApp() {
  if (Capacitor?.isNativePlatform) {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      // Fall through to protocol detection.
    }
  }

  const protocol = globalThis.location?.protocol;
  return protocol ? NATIVE_PROTOCOLS.has(protocol) : false;
}

export function getNativePlatform() {
  if (Capacitor?.getPlatform) {
    try {
      return Capacitor.getPlatform();
    } catch {
      // Fall through to user-agent detection.
    }
  }

  const userAgent = globalThis.navigator?.userAgent || '';
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'web';
}
