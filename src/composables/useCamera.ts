import { ref, readonly, onUnmounted } from 'vue'
import type { CapturedImage, CameraFacingMode, TouchFocusPoint } from '@/types/camera.types'
import { requestUserMedia } from '@/utils/media.util'

const CAPTURE_MIME = 'image/jpeg'
const CAPTURE_QUALITY = 0.92

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const facingMode = ref<CameraFacingMode>('environment')
  const isReady = ref(false)
  const isTorchOn = ref(false)
  const isTorchSupported = ref(false)
  const isFocusSupported = ref(false)
  const focusRipple = ref<TouchFocusPoint | null>(null)
  const error = ref<string | null>(null)

  async function startCamera(el: HTMLVideoElement, facing: CameraFacingMode = 'environment'): Promise<void> {
    error.value = null
    facingMode.value = facing

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    }

    try {
      const mediaStream = await requestUserMedia(constraints)
      stream.value = mediaStream
      videoRef.value = el
      el.srcObject = mediaStream
      await el.play()
      isReady.value = true
      detectCapabilities(mediaStream)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '카메라 접근에 실패했습니다.'
      isReady.value = false
    }
  }

  function detectCapabilities(mediaStream: MediaStream): void {
    const track = mediaStream.getVideoTracks()[0]
    if (!track) return

    const capabilities = track.getCapabilities?.() ?? {}
    isTorchSupported.value = 'torch' in capabilities
    // pointsOfInterest 또는 focusMode 지원 여부 확인
    isFocusSupported.value = 'focusMode' in capabilities || 'pointsOfInterest' in capabilities
  }

  async function applyTouchFocus(point: TouchFocusPoint, videoEl: HTMLVideoElement): Promise<void> {
    if (!stream.value || !isFocusSupported.value) return

    const track = stream.value.getVideoTracks()[0]
    if (!track) return

    const rect = videoEl.getBoundingClientRect()
    // 비디오 요소 기준 상대 좌표(0~1)로 변환
    const relX = (point.x - rect.left) / rect.width
    const relY = (point.y - rect.top) / rect.height

    // 포커스 리플 UI 표시
    focusRipple.value = { x: point.x, y: point.y }
    setTimeout(() => {
      focusRipple.value = null
    }, 1000)

    try {
      await track.applyConstraints({
        advanced: [
          {
            focusMode: 'manual',
            pointsOfInterest: [{ x: relX, y: relY }],
          } as MediaTrackConstraintSet,
        ],
      })
    } catch {
      // focusMode 미지원 기기에서 무시
    }
  }

  function capturePhoto(): CapturedImage | null {
    const video = videoRef.value
    if (!video || !isReady.value) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL(CAPTURE_MIME, CAPTURE_QUALITY)
    const file = dataUrlToFile(dataUrl, `capture_${Date.now()}.jpg`)

    return {
      file,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now(),
    }
  }

  async function toggleFacing(): Promise<void> {
    const newFacing: CameraFacingMode = facingMode.value === 'environment' ? 'user' : 'environment'
    stopCamera()
    if (videoRef.value) {
      await startCamera(videoRef.value, newFacing)
    }
  }

  async function toggleTorch(): Promise<void> {
    if (!stream.value || !isTorchSupported.value) return

    const track = stream.value.getVideoTracks()[0]
    if (!track) return

    const newState = !isTorchOn.value
    try {
      await track.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet],
      })
      isTorchOn.value = newState
    } catch {
      // 토치 제어 실패 시 무시
    }
  }

  function stopCamera(): void {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
      stream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isReady.value = false
    isTorchOn.value = false
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    videoRef,
    isReady: readonly(isReady),
    isTorchOn: readonly(isTorchOn),
    isTorchSupported: readonly(isTorchSupported),
    isFocusSupported: readonly(isFocusSupported),
    focusRipple: readonly(focusRipple),
    facingMode: readonly(facingMode),
    error: readonly(error),
    startCamera,
    stopCamera,
    capturePhoto,
    applyTouchFocus,
    toggleFacing,
    toggleTorch,
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(base64)
  const uint8 = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    uint8[i] = bytes.charCodeAt(i)
  }
  return new File([uint8], filename, { type: mime })
}
