<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useQrScanner } from '@/composables/useQrScanner'
import type { QrScanResult } from '@/types/camera.types'

const emit = defineEmits<{
  'qr-detected': [result: QrScanResult]
  'close': []
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const detectedResult = ref<QrScanResult | null>(null)
const isPaused = ref(false)

const { isScanning, error, startScan, pauseScan, resumeScan, stopScan } = useQrScanner()

onMounted(async () => {
  if (videoEl.value && canvasEl.value) {
    await startScan(videoEl.value, canvasEl.value, handleDetected)
  }
})

onUnmounted(() => {
  stopScan()
})

function handleDetected(result: QrScanResult): void {
  detectedResult.value = result
  isPaused.value = true
  pauseScan()
  emit('qr-detected', result)
}

function handleRescan(): void {
  detectedResult.value = null
  isPaused.value = false
  resumeScan(handleDetected)
}
</script>

<template>
  <div class="qr-scanner">
    <div v-if="error" class="qr-scanner__error">
      <p class="text-sm text-white text-center px-4">{{ error }}</p>
    </div>

    <!-- 카메라 뷰 -->
    <div class="qr-scanner__viewport">
      <video
        ref="videoEl"
        class="qr-scanner__video"
        autoplay
        playsinline
        muted
      />
      <!-- jsQR 디코딩용 오프스크린 캔버스 -->
      <canvas ref="canvasEl" class="qr-scanner__canvas" />

      <!-- 스캔 프레임 오버레이 -->
      <div class="qr-scanner__overlay">
        <div class="qr-scanner__overlay-top" />
        <div class="qr-scanner__overlay-middle">
          <div class="qr-scanner__overlay-side" />
          <div
            class="qr-scanner__frame"
            :class="{ 'qr-scanner__frame--detected': !!detectedResult }"
          >
            <!-- 모서리 마커 -->
            <span class="qr-scanner__corner qr-scanner__corner--tl" />
            <span class="qr-scanner__corner qr-scanner__corner--tr" />
            <span class="qr-scanner__corner qr-scanner__corner--bl" />
            <span class="qr-scanner__corner qr-scanner__corner--br" />

            <!-- 스캔 라인 (스캔 중에만 표시) -->
            <div v-if="isScanning && !detectedResult" class="qr-scanner__scan-line" />
          </div>
          <div class="qr-scanner__overlay-side" />
        </div>
        <div class="qr-scanner__overlay-bottom" />
      </div>
    </div>

    <!-- 상단 바 -->
    <div class="qr-scanner__top-bar">
      <button
        class="qr-scanner__icon-btn"
        aria-label="닫기"
        @click="emit('close')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <span class="text-white text-sm font-medium">QR 코드 스캔</span>
      <div class="w-12" />
    </div>

    <!-- 하단 안내 / 결과 -->
    <div class="qr-scanner__bottom-bar">
      <Transition name="slide-up" mode="out-in">
        <div v-if="detectedResult" key="result" class="qr-scanner__result-card">
          <p class="qr-scanner__result-label">스캔 결과</p>
          <p class="qr-scanner__result-data">{{ detectedResult.data }}</p>
          <button class="qr-scanner__rescan-btn" @click="handleRescan">
            다시 스캔
          </button>
        </div>
        <p v-else key="hint" class="qr-scanner__hint">
          QR 코드를 프레임 안에 맞춰주세요
        </p>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.qr-scanner {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background-color: #000;
  z-index: 100;
}

.qr-scanner__error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0.75rem;
  max-width: min(90vw, 22rem);
  white-space: pre-line;
  line-height: 1.5;
}

.qr-scanner__viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.qr-scanner__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qr-scanner__canvas {
  display: none;
}

/* 오버레이: 프레임 바깥 어둡게 */
.qr-scanner__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.qr-scanner__overlay-top,
.qr-scanner__overlay-bottom {
  flex: 1;
  background: rgba(0, 0, 0, 0.55);
}

.qr-scanner__overlay-middle {
  display: flex;
  flex-direction: row;
}

.qr-scanner__overlay-side {
  flex: 1;
  background: rgba(0, 0, 0, 0.55);
}

.qr-scanner__frame {
  position: relative;
  width: 260px;
  height: 260px;
  flex-shrink: 0;
}

.qr-scanner__frame--detected .qr-scanner__corner {
  border-color: #22c55e;
}

/* 모서리 마커 */
.qr-scanner__corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #fff;
  border-style: solid;
}

.qr-scanner__corner--tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
.qr-scanner__corner--tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.qr-scanner__corner--bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
.qr-scanner__corner--br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

/* 스캔 라인 애니메이션 */
.qr-scanner__scan-line {
  position: absolute;
  left: 4px;
  right: 4px;
  height: 2px;
  background: linear-gradient(to right, transparent, #3b82f6, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 4px; }
  100% { top: calc(100% - 4px); }
}

/* 상단/하단 바 */
.qr-scanner__top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(env(safe-area-inset-top), 1rem) 1rem 0.75rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
}

.qr-scanner__bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 1.5rem max(env(safe-area-inset-bottom), 1.5rem);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  text-align: center;
}

.qr-scanner__hint {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.875rem;
}

.qr-scanner__result-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qr-scanner__result-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.qr-scanner__result-data {
  font-size: 0.9375rem;
  color: #fff;
  word-break: break-all;
  font-weight: 500;
}

.qr-scanner__rescan-btn {
  margin-top: 0.25rem;
  align-self: flex-start;
  padding: 0.375rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.qr-scanner__rescan-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.qr-scanner__icon-btn {
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
}

/* 슬라이드업 트랜지션 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
