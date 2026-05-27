<script setup lang="ts">
import { ref } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import type { CapturedImage } from '@/types/camera.types'

interface Props {
  fieldName?: string
  multiple?: boolean
  maxCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'image',
  multiple: true,
  maxCount: 10,
})

const emit = defineEmits<{
  'upload-ready': [formData: FormData]
  'files-changed': [count: number]
}>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const {
  selectedFiles,
  isDragging,
  validationError,
  handleInputChange,
  handleDrop,
  addCapturedImage,
  removeFile,
  clearAll,
  buildFormData,
  openFilePicker,
} = useImageUpload()

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(): void {
  isDragging.value = false
}

function handleDropWrapper(event: DragEvent): void {
  event.preventDefault()
  handleDrop(event)
  emit('files-changed', selectedFiles.value.length)
}

function handleChangeWrapper(event: Event): void {
  handleInputChange(event)
  emit('files-changed', selectedFiles.value.length)
}

function handleRemove(index: number): void {
  removeFile(index)
  emit('files-changed', selectedFiles.value.length)
}

function handlePickerOpen(): void {
  if (fileInputEl.value) {
    openFilePicker(fileInputEl.value)
  }
}

function addFromCamera(captured: CapturedImage): void {
  addCapturedImage(captured)
  emit('files-changed', selectedFiles.value.length)
}

function submitUpload(): void {
  if (selectedFiles.value.length === 0) return
  const formData = buildFormData(props.fieldName)
  emit('upload-ready', formData)
}

defineExpose({ addFromCamera, submitUpload, clearAll })
</script>

<template>
  <div class="image-upload">
    <!-- 히든 파일 인풋 (웹 input file 매핑) -->
    <input
      ref="fileInputEl"
      type="file"
      :accept="'image/jpeg,image/png,image/webp,image/heic'"
      :multiple="props.multiple"
      class="image-upload__file-input"
      aria-label="이미지 파일 선택"
      @change="handleChangeWrapper"
    />

    <!-- 드롭존 -->
    <div
      class="image-upload__dropzone"
      :class="{ 'image-upload__dropzone--dragging': isDragging }"
      role="button"
      tabindex="0"
      aria-label="이미지를 드래그하거나 클릭하여 선택"
      @click="handlePickerOpen"
      @keydown.enter="handlePickerOpen"
      @keydown.space.prevent="handlePickerOpen"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDropWrapper"
    >
      <div class="image-upload__dropzone-content">
        <svg class="image-upload__dropzone-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p class="image-upload__dropzone-label">
          이미지를 선택하거나 드래그하세요
        </p>
        <p class="image-upload__dropzone-sublabel">
          JPEG, PNG, WEBP, HEIC · 최대 10MB
        </p>
      </div>
    </div>

    <!-- 유효성 오류 -->
    <Transition name="fade">
      <p v-if="validationError" class="image-upload__error-msg">
        {{ validationError }}
      </p>
    </Transition>

    <!-- 미리보기 목록 -->
    <div v-if="selectedFiles.length > 0" class="image-upload__preview-list">
      <div
        v-for="(item, index) in selectedFiles"
        :key="`${item.name}-${index}`"
        class="image-upload__preview-item"
      >
        <img
          :src="item.previewUrl"
          :alt="item.name"
          class="image-upload__preview-thumb"
        />
        <div class="image-upload__preview-info">
          <p class="image-upload__preview-name">{{ item.name }}</p>
          <p class="image-upload__preview-size">{{ item.sizeKb }} KB</p>
        </div>
        <button
          class="image-upload__preview-remove"
          :aria-label="`${item.name} 삭제`"
          @click.stop="handleRemove(index)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 업로드 액션 바 -->
    <div v-if="selectedFiles.length > 0" class="image-upload__action-bar">
      <button class="image-upload__clear-btn" @click="clearAll">
        전체 삭제
      </button>
      <button class="image-upload__submit-btn" @click="submitUpload">
        업로드 ({{ selectedFiles.length }}장)
      </button>
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-upload__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.image-upload__dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  background-color: var(--color-surface-raised);
  outline: none;
}

.image-upload__dropzone:focus-visible {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.image-upload__dropzone--dragging {
  border-color: var(--color-primary);
  background-color: var(--color-primary-50);
}

.image-upload__dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.image-upload__dropzone-icon {
  color: var(--color-text-secondary);
}

.image-upload__dropzone-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.image-upload__dropzone-sublabel {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.image-upload__error-msg {
  font-size: 0.8125rem;
  color: #ef4444;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

.image-upload__preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-upload__preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface-raised);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.image-upload__preview-thumb {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.image-upload__preview-info {
  flex: 1;
  min-width: 0;
}

.image-upload__preview-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-upload__preview-size {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.125rem;
}

.image-upload__preview-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.image-upload__preview-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

.image-upload__action-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.25rem;
}

.image-upload__clear-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.image-upload__clear-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
}

.image-upload__submit-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.image-upload__submit-btn:hover {
  background: var(--color-primary-700);
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
