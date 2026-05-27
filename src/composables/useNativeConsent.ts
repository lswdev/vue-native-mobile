import { ref, computed, readonly } from 'vue'
import type { ConsentStatus, ConsentStep, NativeConsentState } from '@/types/consent.types'
import {
  createEmptyConsent,
  getStoredConsent,
  hasCompletedConsentFlow,
  isConsentGranted,
  saveStoredConsent,
} from '@/utils/consent.util'

export function useNativeConsent() {
  const consent = ref<NativeConsentState>(createEmptyConsent())
  const currentStep = ref<ConsentStep>('camera')
  const isFlowVisible = ref(false)

  const isCameraGranted = computed(() => isConsentGranted(consent.value.camera))
  const isImageGranted = computed(() => isConsentGranted(consent.value.image))

  function loadConsent(): void {
    const stored = getStoredConsent()
    if (stored) {
      consent.value = { ...stored }
      if (stored.camera !== null) {
        currentStep.value = 'image'
      }
    }
    isFlowVisible.value = !hasCompletedConsentFlow()
  }

  function resolveStep(step: ConsentStep, status: ConsentStatus): void {
    if (step === 'camera') {
      consent.value = { ...consent.value, camera: status }
      saveStoredConsent(consent.value)
      currentStep.value = 'image'
      return
    }

    consent.value = { ...consent.value, image: status }
    saveStoredConsent(consent.value)
    isFlowVisible.value = false
  }

  function resetConsentForDev(): void {
    consent.value = createEmptyConsent()
    localStorage.removeItem('native_consent_v1')
    currentStep.value = 'camera'
    isFlowVisible.value = true
  }

  return {
    consent: readonly(consent),
    currentStep,
    isFlowVisible,
    isCameraGranted,
    isImageGranted,
    loadConsent,
    resolveStep,
    resetConsentForDev,
  }
}
