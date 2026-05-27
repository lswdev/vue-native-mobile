<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CameraCapture from '@/components/common/CameraCapture.vue'
import { useCameraStore } from '@/stores/camera.store'
import type { CapturedImage } from '@/types/camera.types'

const router = useRouter()
const cameraStore = useCameraStore()

const isCameraOpen = ref(false)
const lastCapture = ref<CapturedImage | null>(null)

function handlePhotoCaptured(image: CapturedImage): void {
  lastCapture.value = image
  cameraStore.addCapturedImage(image)
  isCameraOpen.value = false
}
</script>

<template>
  <div class="camera-page">
    <!-- 카메라 촬영 UI (전체화면 오버레이) -->
    <Teleport to="body">
      <Transition name="camera-open">
        <CameraCapture
          v-if="isCameraOpen"
          @photo-captured="handlePhotoCaptured"
          @close="isCameraOpen = false"
        />
      </Transition>
    </Teleport>

    <!-- 페이지 콘텐츠 -->
    <header class="camera-page__header">
      <button class="camera-page__back-btn" aria-label="뒤로 가기" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="camera-page__title">카메라 촬영</h1>
    </header>

    <main class="camera-page__main">
      <!-- 촬영 버튼 -->
      <button
        class="camera-page__open-btn"
        @click="isCameraOpen = true"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>카메라 열기</span>
      </button>

      <!-- 마지막 촬영 미리보기 -->
      <Transition name="fade">
        <div v-if="lastCapture" class="camera-page__preview">
          <p class="camera-page__preview-label">마지막 촬영</p>
          <img
            :src="lastCapture.dataUrl"
            alt="촬영된 사진"
            class="camera-page__preview-img"
          />
          <p class="camera-page__preview-meta">
            {{ lastCapture.width }} × {{ lastCapture.height }} ·
            {{ Math.round(lastCapture.file.size / 1024) }} KB
          </p>
        </div>
      </Transition>

      <!-- 촬영 히스토리 카운트 -->
      <p v-if="cameraStore.capturedImages.length > 0" class="camera-page__history-info">
        총 {{ cameraStore.capturedImages.length }}장 촬영됨
      </p>
    </main>
  </div>
</template>

<style scoped>
.camera-page {
  min-height: 100dvh;
  background: var(--color-surface);
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
}

.camera-page__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: max(env(safe-area-inset-top), 1rem) 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.camera-page__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--color-text-primary);
}

.camera-page__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.camera-page__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1.25rem;
}

.camera-page__open-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.camera-page__open-btn:active {
  transform: scale(0.97);
  background: var(--color-primary-700);
}

.camera-page__preview {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.camera-page__preview-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.camera-page__preview-img {
  width: 100%;
  border-radius: 0.75rem;
  object-fit: cover;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.camera-page__preview-meta {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  text-align: right;
}

.camera-page__history-info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.camera-open-enter-active,
.camera-open-leave-active {
  transition: opacity 0.2s ease;
}
.camera-open-enter-from,
.camera-open-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
}
</style>
