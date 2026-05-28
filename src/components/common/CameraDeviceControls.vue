<script setup lang="ts">
interface Props {
  isBrightnessSupported: boolean
  brightness: number
  brightnessMin: number
  brightnessMax: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:brightness': [value: number]
}>()

function handleBrightnessInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:brightness', value)
}
</script>

<template>
  <aside v-if="isBrightnessSupported" class="camera-device-controls">
    <div class="camera-device-controls__brightness">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
      <input
        type="range"
        class="camera-device-controls__slider"
        :min="brightnessMin"
        :max="brightnessMax"
        :step="0.1"
        :value="brightness"
        aria-label="밝기 조절"
        @input="handleBrightnessInput"
      />
    </div>
  </aside>
</template>

<style scoped>
.camera-device-controls {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.625rem 0.5rem;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 1rem;
  backdrop-filter: blur(8px);
}

.camera-device-controls__brightness {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
}

.camera-device-controls__slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 2rem;
  height: 7rem;
  accent-color: #3b82f6;
  cursor: pointer;
}
</style>
