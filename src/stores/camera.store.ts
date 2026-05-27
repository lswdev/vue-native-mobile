import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { CapturedImage, QrScanResult } from '@/types/camera.types'
import type { UploadedFileDto } from '@/services/upload.service'

export const useCameraStore = defineStore('camera', () => {
  const capturedImages = ref<CapturedImage[]>([])
  const qrHistory = ref<QrScanResult[]>([])
  const uploadedFiles = ref<UploadedFileDto[]>([])
  const isUploading = ref(false)

  function addCapturedImage(image: CapturedImage): void {
    capturedImages.value.unshift(image)
  }

  function clearCapturedImages(): void {
    capturedImages.value = []
  }

  function addQrResult(result: QrScanResult): void {
    const isDuplicate = qrHistory.value.some((r) => r.data === result.data)
    if (!isDuplicate) {
      qrHistory.value.unshift(result)
    }
  }

  function clearQrHistory(): void {
    qrHistory.value = []
  }

  function addUploadedFile(file: UploadedFileDto): void {
    uploadedFiles.value.unshift(file)
  }

  return {
    capturedImages: readonly(capturedImages),
    qrHistory: readonly(qrHistory),
    uploadedFiles: readonly(uploadedFiles),
    isUploading,
    addCapturedImage,
    clearCapturedImages,
    addQrResult,
    clearQrHistory,
    addUploadedFile,
  }
})
