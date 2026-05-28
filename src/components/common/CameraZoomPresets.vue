<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  zoomLevel: number
  zoomMin: number
  zoomMax: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-preset': [value: number]
}>()

const presets = [
  { label: '.6', value: 0.6 },
  { label: '1x', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
]

const TOLERANCE = 0.25
const selectedPreset = ref(1)

function isPresetInRange(value: number): boolean {
  return value >= props.zoomMin - 0.05 && value <= props.zoomMax + 0.05
}

function findClosestPreset(zoom: number): number {
  const available = presets.filter((preset) => isPresetInRange(preset.value))
  if (available.length === 0) return 1

  let closest = available.find((preset) => preset.value === 1)?.value ?? available[0].value
  let minDiff = Infinity

  for (const preset of available) {
    const diff = Math.abs(zoom - preset.value)
    const isBetter =
      diff < minDiff - 0.001 ||
      (Math.abs(diff - minDiff) < 0.001 && preset.value === 1)

    if (isBetter) {
      minDiff = diff
      closest = preset.value
    }
  }

  return closest
}

watch(
  () => props.zoomLevel,
  (zoom) => {
    const closest = findClosestPreset(zoom)
    if (Math.abs(zoom - closest) <= TOLERANCE) {
      selectedPreset.value = closest
    }
  },
  { immediate: true },
)

const activePreset = computed(() => selectedPreset.value)

function isActive(value: number): boolean {
  return activePreset.value === value
}

function handleSelect(value: number): void {
  if (!isPresetInRange(value)) return
  selectedPreset.value = value
  emit('select-preset', value)
}
</script>

<template>
  <div class="camera-zoom-presets">
    <button
      v-for="preset in presets"
      :key="preset.label"
      type="button"
      class="camera-zoom-presets__item"
      :class="{
        'camera-zoom-presets__item--active': isActive(preset.value),
        'camera-zoom-presets__item--disabled': !isPresetInRange(preset.value),
      }"
      :disabled="!isPresetInRange(preset.value)"
      @click="handleSelect(preset.value)"
    >
      {{ preset.label }}
    </button>
  </div>
</template>

<style scoped>
.camera-zoom-presets {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.375rem 0.625rem;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
}

.camera-zoom-presets__item {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.375rem;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.camera-zoom-presets__item--active {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.camera-zoom-presets__item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.camera-zoom-presets__item:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.32);
}
</style>
