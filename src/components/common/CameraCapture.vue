<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import CameraFlashButton from '@/components/common/CameraFlashButton.vue'
import CameraZoomPresets from '@/components/common/CameraZoomPresets.vue'
import CameraDeviceControls from '@/components/common/CameraDeviceControls.vue'
import cameraExchangeIcon from '@/assets/icons/camera_exchange.svg'
import type { CapturedImage } from '@/types/camera.types'

const emit = defineEmits<{
  'photo-captured': [image: CapturedImage]
  'close': []
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const {
  isReady,
  isTorchOn,
  isTorchAvailable,
  brightness,
  brightnessMin,
  brightnessMax,
  isBrightnessSupported,
  focusRipple,
  zoomLevel,
  zoomMin,
  zoomMax,
  facingMode,
  error,
  startCamera,
  stopCamera,
  capturePhoto,
  toggleFacing,
  toggleTorch,
  setBrightness,
  setZoom,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
} = useCamera()

const shutter = ref(false)

onMounted(async () => {
  if (videoEl.value) {
    await startCamera(videoEl.value)
  }
})

onUnmounted(() => {
  stopCamera()
})

function handleCapture(): void {
  const image = capturePhoto()
  if (!image) return

  shutter.value = true
  setTimeout(() => {
    shutter.value = false
  }, 150)

  emit('photo-captured', image)
}
</script>

<template>
  <div class="camera-capture">
    <div v-if="error" class="camera-capture__error">
      <p class="text-sm text-white">{{ error }}</p>
    </div>

    <div
      class="camera-capture__viewport"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="onClick"
    >
      <video
        ref="videoEl"
        class="camera-capture__video"
        :class="{ 'camera-capture__video--mirrored': facingMode === 'user' }"
        autoplay
        playsinline
        muted
      />

      <!-- 터치 포커스 리플 -->
      <Transition name="ripple">
        <div
          v-if="focusRipple"
          class="camera-capture__focus-ring"
          :style="{
            left: `${focusRipple.x}px`,
            top: `${focusRipple.y}px`,
          }"
        />
      </Transition>

      <!-- 셔터 플래시 오버레이 -->
      <div
        v-if="shutter"
        class="camera-capture__shutter-flash"
      />
    </div>

    <CameraDeviceControls
      :is-brightness-supported="isBrightnessSupported"
      :brightness="brightness"
      :brightness-min="brightnessMin"
      :brightness-max="brightnessMax"
      @update:brightness="setBrightness"
    />

    <!-- 상단 컨트롤 -->
    <div class="camera-capture__top-bar">
      <button
        class="camera-capture__icon-btn"
        aria-label="닫기"
        @click="emit('close')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <CameraFlashButton
        :is-torch-on="isTorchOn"
        :is-torch-available="isTorchAvailable"
        @toggle-torch="toggleTorch"
      />
    </div>

    <!-- 하단 컨트롤 -->
    <div class="camera-capture__bottom-bar">
      <CameraZoomPresets
        class="camera-capture__zoom-presets"
        :zoom-level="zoomLevel"
        :zoom-min="zoomMin"
        :zoom-max="zoomMax"
        @select-preset="setZoom"
      />

      <div class="camera-capture__bottom-bar-inner">
        <div class="w-14" />

        <button
          class="camera-capture__shutter-btn"
          :disabled="!isReady"
          aria-label="촬영"
          @click="handleCapture"
        >
          <span class="camera-capture__shutter-btn-inner" />
        </button>

        <button
          class="camera-capture__icon-btn camera-capture__icon-btn--dark"
          aria-label="전후면 카메라 전환"
          @click="toggleFacing"
        >
          <img :src="cameraExchangeIcon" width="24" height="24" alt="" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camera-capture {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background-color: #000;
  z-index: 100;
}

.camera-capture__error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0.5rem;
  text-align: center;
  max-width: min(90vw, 22rem);
  white-space: pre-line;
  line-height: 1.5;
}

.camera-capture__viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.camera-capture__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-capture__video--mirrored {
  transform: scaleX(-1);
}

.camera-capture__focus-ring {
  position: fixed;
  width: 60px;
  height: 60px;
  margin-left: -30px;
  margin-top: -30px;
  border: 2px solid #facc15;
  border-radius: 4px;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}

.camera-capture__shutter-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0.6;
  pointer-events: none;
  animation: flash 150ms ease-out forwards;
}

.camera-capture__top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(env(safe-area-inset-top), 1rem) 1rem 0.75rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
}

.camera-capture__bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.camera-capture__zoom-presets {
  margin-bottom: 0.25rem;
}

.camera-capture__bottom-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 2rem;
}

.camera-capture__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.camera-capture__icon-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.camera-capture__icon-btn--active {
  color: #facc15;
}

.camera-capture__icon-btn--dark {
  background: rgba(0, 0, 0, 0.35);
}

.camera-capture__shutter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 9999px;
  border: 3px solid #fff;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
}

.camera-capture__shutter-btn:active {
  transform: scale(0.92);
}

.camera-capture__shutter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.camera-capture__shutter-btn-inner {
  display: block;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  background: #fff;
}

@keyframes flash {
  from { opacity: 0.6; }
  to { opacity: 0; }
}

.ripple-enter-active {
  animation: ripple-in 0.2s ease-out;
}
.ripple-leave-active {
  animation: ripple-out 0.4s ease-in forwards;
}

@keyframes ripple-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes ripple-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.4); }
}
</style>
