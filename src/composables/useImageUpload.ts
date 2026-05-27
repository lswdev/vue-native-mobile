import { ref, readonly } from 'vue'
import type { CapturedImage, UploadPayload } from '@/types/camera.types'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE_MB = 10

export interface PreviewItem {
  file: File
  previewUrl: string
  name: string
  sizeKb: number
}

export function useImageUpload() {
  const selectedFiles = ref<PreviewItem[]>([])
  const isDragging = ref(false)
  const validationError = ref<string | null>(null)

  function handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    processFiles(Array.from(input.files))
    // 같은 파일 재선택 허용을 위해 value 초기화
    input.value = ''
  }

  function handleDrop(event: DragEvent): void {
    isDragging.value = false
    const files = event.dataTransfer?.files
    if (!files?.length) return
    processFiles(Array.from(files))
  }

  function processFiles(files: File[]): void {
    validationError.value = null
    const validated = files.filter((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        validationError.value = `지원하지 않는 파일 형식입니다. (허용: JPEG, PNG, WEBP, HEIC)`
        return false
      }
      const sizeMb = file.size / (1024 * 1024)
      if (sizeMb > MAX_FILE_SIZE_MB) {
        validationError.value = `파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다.`
        return false
      }
      return true
    })

    validated.forEach((file) => {
      const previewUrl = URL.createObjectURL(file)
      selectedFiles.value.push({
        file,
        previewUrl,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      })
    })
  }

  function addCapturedImage(captured: CapturedImage): void {
    selectedFiles.value.push({
      file: captured.file,
      previewUrl: captured.dataUrl,
      name: captured.file.name,
      sizeKb: Math.round(captured.file.size / 1024),
    })
  }

  function removeFile(index: number): void {
    const item = selectedFiles.value[index]
    if (item) {
      URL.revokeObjectURL(item.previewUrl)
      selectedFiles.value.splice(index, 1)
    }
  }

  function clearAll(): void {
    selectedFiles.value.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    selectedFiles.value = []
    validationError.value = null
  }

  function buildUploadPayload(index: number, fieldName = 'image'): UploadPayload | null {
    const item = selectedFiles.value[index]
    if (!item) return null
    return {
      file: item.file,
      fieldName,
    }
  }

  function buildFormData(fieldName = 'image'): FormData {
    const formData = new FormData()
    selectedFiles.value.forEach((item) => {
      formData.append(fieldName, item.file, item.file.name)
    })
    return formData
  }

  function openFilePicker(inputEl: HTMLInputElement): void {
    inputEl.click()
  }

  return {
    selectedFiles: readonly(selectedFiles),
    isDragging,
    validationError: readonly(validationError),
    handleInputChange,
    handleDrop,
    addCapturedImage,
    removeFile,
    clearAll,
    buildUploadPayload,
    buildFormData,
    openFilePicker,
  }
}
