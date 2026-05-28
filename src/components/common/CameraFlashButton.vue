<script setup lang="ts">
interface Props {
  isTorchOn: boolean
  isTorchAvailable: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'toggle-torch': []
}>()
</script>

<template>
  <button
    type="button"
    class="camera-flash-btn"
    :class="{
      'camera-flash-btn--active': isTorchOn,
      'camera-flash-btn--disabled': !isTorchAvailable,
    }"
    :disabled="!isTorchAvailable"
    aria-label="플래시"
    @click="emit('toggle-torch')"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      <line v-if="!isTorchOn" x1="2" y1="2" x2="22" y2="22" />
    </svg>
  </button>
</template>

<style scoped>
.camera-flash-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  cursor: pointer;
}

.camera-flash-btn--active {
  color: #facc15;
  background: rgba(250, 204, 21, 0.2);
}

.camera-flash-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.camera-flash-btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}
</style>
