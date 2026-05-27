<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import NativeConsentFlow from '@/components/common/NativeConsentFlow.vue'
import { useNativeConsent } from '@/composables/useNativeConsent'
import type { ConsentStatus, ConsentStep } from '@/types/consent.types'

const { currentStep, isFlowVisible, loadConsent, resolveStep } = useNativeConsent()

onMounted(() => {
  loadConsent()
})

function handleConsentResolve(step: ConsentStep, status: ConsentStatus): void {
  resolveStep(step, status)
}
</script>

<template>
  <RouterView />

  <NativeConsentFlow
    v-if="isFlowVisible"
    :step="currentStep"
    @resolve="handleConsentResolve"
  />
</template>
