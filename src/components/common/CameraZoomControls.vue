<script setup lang="ts">
interface Props {
  zoomLevel: number
  zoomMin: number
  zoomMax: number
  isZoomSupported: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
}>()
</script>

<template>
  <div v-if="isZoomSupported" class="camera-zoom">
    <button
      type="button"
      class="camera-zoom__btn"
      aria-label="줌 아웃"
      :disabled="zoomLevel <= zoomMin"
      @click="emit('zoom-out')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>

    <span class="camera-zoom__label">{{ zoomLevel.toFixed(1) }}x</span>

    <button
      type="button"
      class="camera-zoom__btn"
      aria-label="줌 인"
      :disabled="zoomLevel >= zoomMax"
      @click="emit('zoom-in')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.camera-zoom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
}

.camera-zoom__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
}

.camera-zoom__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.camera-zoom__btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.camera-zoom__label {
  min-width: 2.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
}
</style>
