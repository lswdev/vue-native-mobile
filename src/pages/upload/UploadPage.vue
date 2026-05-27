<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ImageUpload from '@/components/common/ImageUpload.vue'
import CameraCapture from '@/components/common/CameraCapture.vue'
import { uploadService } from '@/services/upload.service'
import { useCameraStore } from '@/stores/camera.store'
import type { CapturedImage } from '@/types/camera.types'

const router = useRouter()
const cameraStore = useCameraStore()

const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const isCameraOpen = ref(false)
const isUploading = ref(false)
const uploadResult = ref<string | null>(null)
const uploadError = ref<string | null>(null)

function handlePhotoCaptured(image: CapturedImage): void {
  isCameraOpen.value = false
  cameraStore.addCapturedImage(image)
  imageUploadRef.value?.addFromCamera(image)
}

async function handleUploadReady(formData: FormData): Promise<void> {
  isUploading.value = true
  uploadResult.value = null
  uploadError.value = null

  try {
    const files = formData.getAll('image') as File[]
    const results = await uploadService.uploadMultiple(files, 'image')
    results.forEach((r) => cameraStore.addUploadedFile(r))
    uploadResult.value = `${results.length}개 파일이 업로드되었습니다.`
    imageUploadRef.value?.clearAll()
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : '업로드에 실패했습니다.'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="upload-page">
    <!-- 카메라 오버레이 -->
    <Teleport to="body">
      <Transition name="fade">
        <CameraCapture
          v-if="isCameraOpen"
          @photo-captured="handlePhotoCaptured"
          @close="isCameraOpen = false"
        />
      </Transition>
    </Teleport>

    <header class="upload-page__header">
      <button class="upload-page__back-btn" aria-label="뒤로 가기" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="upload-page__title">이미지 업로드</h1>
    </header>

    <main class="upload-page__main">
      <!-- 카메라로 촬영 버튼 -->
      <button class="upload-page__camera-btn" @click="isCameraOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        카메라로 촬영 후 추가
      </button>

      <!-- 이미지 업로드 컴포넌트 (input file 매핑) -->
      <ImageUpload
        ref="imageUploadRef"
        field-name="image"
        :multiple="true"
        :max-count="10"
        @upload-ready="handleUploadReady"
        @files-changed="(count) => count"
      />

      <!-- 업로드 진행 상태 -->
      <Transition name="fade">
        <div v-if="isUploading" class="upload-page__status upload-page__status--loading">
          <div class="upload-page__spinner" />
          <span>업로드 중...</span>
        </div>
        <div v-else-if="uploadResult" class="upload-page__status upload-page__status--success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {{ uploadResult }}
        </div>
        <div v-else-if="uploadError" class="upload-page__status upload-page__status--error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ uploadError }}
        </div>
      </Transition>

      <!-- 업로드 완료 목록 -->
      <div v-if="cameraStore.uploadedFiles.length > 0" class="upload-page__uploaded">
        <p class="upload-page__uploaded-title">업로드 완료</p>
        <div
          v-for="(file, i) in cameraStore.uploadedFiles"
          :key="file.id ?? i"
          class="upload-page__uploaded-item"
        >
          <span class="upload-page__uploaded-name">{{ file.fileName }}</span>
          <span class="upload-page__uploaded-size">{{ Math.round(file.fileSize / 1024) }} KB</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.upload-page {
  min-height: 100dvh;
  background: var(--color-surface);
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
}

.upload-page__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: max(env(safe-area-inset-top), 1rem) 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.upload-page__back-btn {
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

.upload-page__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.upload-page__main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem 1.25rem;
  max-width: 600px;
  margin: 0 auto;
}

.upload-page__camera-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s;
}

.upload-page__camera-btn:active {
  background: var(--color-border);
}

.upload-page__status {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.upload-page__status--loading {
  background: #eff6ff;
  color: var(--color-primary);
}

.upload-page__status--success {
  background: #f0fdf4;
  color: #16a34a;
}

.upload-page__status--error {
  background: #fef2f2;
  color: #dc2626;
}

.upload-page__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(37, 99, 235, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-page__uploaded {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-page__uploaded-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.upload-page__uploaded-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

.upload-page__uploaded-name {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.upload-page__uploaded-size {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
