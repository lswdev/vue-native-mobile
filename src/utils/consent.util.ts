import type { ConsentStatus, NativeConsentState } from '@/types/consent.types'

const STORAGE_KEY = 'native_consent_v1'

export function getStoredConsent(): NativeConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as NativeConsentState
  } catch {
    return null
  }
}

export function saveStoredConsent(consent: NativeConsentState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
}

export function hasCompletedConsentFlow(): boolean {
  const stored = getStoredConsent()
  return stored !== null && stored.camera !== null && stored.image !== null
}

export function createEmptyConsent(): NativeConsentState {
  return { camera: null, image: null }
}

export function isConsentGranted(status: ConsentStatus | null): boolean {
  return status === 'granted'
}
