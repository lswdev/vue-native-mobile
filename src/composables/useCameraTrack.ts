import { ref, readonly, computed, onUnmounted } from 'vue'
import type { CameraFacingMode, TouchFocusPoint } from '@/types/camera.types'
import {
  applyBrightness,
  applyTorch,
  applyTouchFocus,
  applyZoom,
  detectTrackCapabilities,
  getCurrentBrightness,
  getCurrentZoom,
} from '@/utils/cameraFocus.util'

const ZOOM_STEP_RATIO = 0.15

export interface BindStreamOptions {
  defaultZoom?: number
  facingMode?: CameraFacingMode
  onFacingChange?: (facing: CameraFacingMode) => Promise<void>
}

export function useCameraTrack() {
  const zoomLevel = ref(1)
  const zoomMin = ref(1)
  const zoomMax = ref(1)
  const isZoomSupported = ref(false)
  const isTorchOn = ref(false)
  const isTorchSupported = ref(false)
  const brightness = ref(0)
  const brightnessMin = ref(0)
  const brightnessMax = ref(0)
  const isBrightnessSupported = ref(false)
  const facingMode = ref<CameraFacingMode>('environment')
  const focusRipple = ref<TouchFocusPoint | null>(null)

  const isTorchAvailable = computed(
    () => facingMode.value === 'environment' && isTorchSupported.value,
  )

  let stream: MediaStream | null = null
  let onFacingChange: ((facing: CameraFacingMode) => Promise<void>) | null = null
  let focusRippleTimer: ReturnType<typeof setTimeout> | null = null
  let pinchStartDistance = 0
  let pinchStartZoom = 1
  let isPinching = false

  async function bindStream(mediaStream: MediaStream, options?: BindStreamOptions): Promise<void> {
    stream = mediaStream
    const caps = detectTrackCapabilities(mediaStream)

    isZoomSupported.value = caps.isZoomSupported
    zoomMin.value = caps.zoomMin
    zoomMax.value = caps.zoomMax
    zoomLevel.value = getCurrentZoom(mediaStream)

    isTorchSupported.value = caps.isTorchSupported
    isTorchOn.value = false

    isBrightnessSupported.value = caps.isBrightnessSupported
    brightnessMin.value = caps.brightnessMin
    brightnessMax.value = caps.brightnessMax
    brightness.value = getCurrentBrightness(mediaStream)

    if (options?.facingMode) {
      facingMode.value = options.facingMode
    }
    onFacingChange = options?.onFacingChange ?? null

    if (options?.defaultZoom !== undefined && caps.isZoomSupported) {
      await setZoom(options.defaultZoom)
    }
  }

  function unbindStream(): void {
    stream = null
    onFacingChange = null
    zoomLevel.value = 1
    isZoomSupported.value = false
    isTorchOn.value = false
    isTorchSupported.value = false
    brightness.value = 0
    isBrightnessSupported.value = false
    focusRipple.value = null
    if (focusRippleTimer) {
      clearTimeout(focusRippleTimer)
      focusRippleTimer = null
    }
  }

  function showFocusRipple(point: TouchFocusPoint): void {
    focusRipple.value = point
    if (focusRippleTimer) clearTimeout(focusRippleTimer)
    focusRippleTimer = setTimeout(() => {
      focusRipple.value = null
    }, 1000)
  }

  async function handleTouchFocus(point: TouchFocusPoint, videoEl: HTMLVideoElement): Promise<void> {
    if (!stream) return
    showFocusRipple(point)
    await applyTouchFocus(stream, point, videoEl)
  }

  async function setZoom(value: number): Promise<void> {
    if (!stream || !isZoomSupported.value) return
    zoomLevel.value = await applyZoom(stream, value)
  }

  async function zoomIn(): Promise<void> {
    const step = Math.max(zoomMax.value * ZOOM_STEP_RATIO, 0.1)
    await setZoom(zoomLevel.value + step)
  }

  async function zoomOut(): Promise<void> {
    const step = Math.max(zoomMax.value * ZOOM_STEP_RATIO, 0.1)
    await setZoom(zoomLevel.value - step)
  }

  async function toggleTorch(): Promise<void> {
    if (!isTorchAvailable.value) return
    await setTorch(!isTorchOn.value)
  }

  async function setTorch(enabled: boolean): Promise<void> {
    if (!stream || facingMode.value !== 'environment') return

    const applied = await applyTorch(stream, enabled)
    if (applied) {
      isTorchOn.value = enabled
      isTorchSupported.value = true
      return
    }

    if (!enabled) {
      isTorchOn.value = false
    }
  }

  async function setBrightness(value: number): Promise<void> {
    if (!stream || !isBrightnessSupported.value) return
    brightness.value = await applyBrightness(stream, value)
  }

  async function toggleFacing(): Promise<void> {
    const nextFacing: CameraFacingMode = facingMode.value === 'environment' ? 'user' : 'environment'

    if (nextFacing === 'user' && isTorchOn.value && stream) {
      const applied = await applyTorch(stream, false)
      if (applied) isTorchOn.value = false
    }

    facingMode.value = nextFacing
    if (onFacingChange) {
      await onFacingChange(nextFacing)
    }
  }

  function getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2 && isZoomSupported.value) {
      isPinching = true
      pinchStartDistance = getTouchDistance(event.touches)
      pinchStartZoom = zoomLevel.value
    }
  }

  function onTouchMove(event: TouchEvent): void {
    if (!isPinching || event.touches.length !== 2) return
    event.preventDefault()
    const distance = getTouchDistance(event.touches)
    const ratio = distance / pinchStartDistance
    void setZoom(pinchStartZoom * ratio)
  }

  function onTouchEnd(event: TouchEvent, videoEl: HTMLVideoElement): void {
    if (event.touches.length > 0) return

    if (isPinching) {
      isPinching = false
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) return

    void handleTouchFocus({ x: touch.clientX, y: touch.clientY }, videoEl)
  }

  function onClick(event: MouseEvent, videoEl: HTMLVideoElement): void {
    void handleTouchFocus({ x: event.clientX, y: event.clientY }, videoEl)
  }

  onUnmounted(() => {
    unbindStream()
  })

  return {
    zoomLevel: readonly(zoomLevel),
    zoomMin: readonly(zoomMin),
    zoomMax: readonly(zoomMax),
    isZoomSupported: readonly(isZoomSupported),
    isTorchOn: readonly(isTorchOn),
    isTorchSupported: readonly(isTorchSupported),
    isTorchAvailable,
    brightness: readonly(brightness),
    brightnessMin: readonly(brightnessMin),
    brightnessMax: readonly(brightnessMax),
    isBrightnessSupported: readonly(isBrightnessSupported),
    facingMode: readonly(facingMode),
    focusRipple: readonly(focusRipple),
    bindStream,
    unbindStream,
    handleTouchFocus,
    setZoom,
    zoomIn,
    zoomOut,
    toggleTorch,
    setTorch,
    setBrightness,
    toggleFacing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onClick,
  }
}
