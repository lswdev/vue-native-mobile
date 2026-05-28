import { ref, readonly, onUnmounted } from 'vue'
import type { CapturedImage, CameraFacingMode, TouchFocusPoint } from '@/types/camera.types'
import { useCameraTrack } from '@/composables/useCameraTrack'
import { requestCameraStream } from '@/utils/cameraDevice.util'
import { applyContinuousAutofocus } from '@/utils/cameraFocus.util'

const CAPTURE_MIME = 'image/jpeg'
const CAPTURE_QUALITY = 0.92
const DEFAULT_CAMERA_ZOOM = 1

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  const trackControls = useCameraTrack()

  async function openStream(el: HTMLVideoElement, facing: CameraFacingMode, isInitial = false): Promise<void> {
    const mediaStream = await requestCameraStream(facing)

    stream.value = mediaStream
    videoRef.value = el
    el.srcObject = mediaStream
    await el.play()
    isReady.value = true

    await applyContinuousAutofocus(mediaStream)
    await trackControls.bindStream(mediaStream, {
      facingMode: facing,
      defaultZoom: isInitial ? DEFAULT_CAMERA_ZOOM : undefined,
      onFacingChange: async (newFacing) => {
        await restartCamera(el, newFacing)
      },
    })
  }

  async function restartCamera(el: HTMLVideoElement, facing: CameraFacingMode): Promise<void> {
    const savedZoom = trackControls.zoomLevel.value
    const savedBrightness = trackControls.brightness.value
    const savedTorch = trackControls.isTorchOn.value

    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
      stream.value = null
    }

    isReady.value = false
    trackControls.unbindStream()

    try {
      await openStream(el, facing, false)

      if (trackControls.isZoomSupported.value) {
        await trackControls.setZoom(savedZoom)
      }
      if (trackControls.isBrightnessSupported.value) {
        await trackControls.setBrightness(savedBrightness)
      }
      if (savedTorch && facing === 'environment') {
        await trackControls.setTorch(true)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '카메라 전환에 실패했습니다.'
    }
  }

  async function startCamera(el: HTMLVideoElement, facing: CameraFacingMode = 'environment'): Promise<void> {
    error.value = null

    try {
      await openStream(el, facing, true)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '카메라 접근에 실패했습니다.'
      isReady.value = false
    }
  }

  async function applyTouchFocusHandler(point: TouchFocusPoint, videoEl: HTMLVideoElement): Promise<void> {
    await trackControls.handleTouchFocus(point, videoEl)
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

  function stopCamera(): void {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
      stream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isReady.value = false
    trackControls.unbindStream()
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    videoRef,
    isReady: readonly(isReady),
    isTorchOn: trackControls.isTorchOn,
    isTorchSupported: trackControls.isTorchSupported,
    isTorchAvailable: trackControls.isTorchAvailable,
    brightness: trackControls.brightness,
    brightnessMin: trackControls.brightnessMin,
    brightnessMax: trackControls.brightnessMax,
    isBrightnessSupported: trackControls.isBrightnessSupported,
    focusRipple: trackControls.focusRipple,
    zoomLevel: trackControls.zoomLevel,
    zoomMin: trackControls.zoomMin,
    zoomMax: trackControls.zoomMax,
    isZoomSupported: trackControls.isZoomSupported,
    facingMode: trackControls.facingMode,
    error: readonly(error),
    startCamera,
    stopCamera,
    capturePhoto,
    applyTouchFocus: applyTouchFocusHandler,
    toggleFacing: trackControls.toggleFacing,
    toggleTorch: trackControls.toggleTorch,
    setBrightness: trackControls.setBrightness,
    setZoom: trackControls.setZoom,
    zoomIn: trackControls.zoomIn,
    zoomOut: trackControls.zoomOut,
    onTouchStart: trackControls.onTouchStart,
    onTouchMove: trackControls.onTouchMove,
    onTouchEnd: (event: TouchEvent) => {
      if (videoRef.value) trackControls.onTouchEnd(event, videoRef.value)
    },
    onClick: (event: MouseEvent) => {
      if (videoRef.value) trackControls.onClick(event, videoRef.value)
    },
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
