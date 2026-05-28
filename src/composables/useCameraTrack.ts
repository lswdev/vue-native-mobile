import { ref, readonly, onUnmounted } from 'vue'
import type { TouchFocusPoint } from '@/types/camera.types'
import {
  applyTouchFocus,
  applyZoom,
  detectTrackCapabilities,
  getCurrentZoom,
} from '@/utils/cameraFocus.util'

const ZOOM_STEP_RATIO = 0.15

export function useCameraTrack() {
  const zoomLevel = ref(1)
  const zoomMin = ref(1)
  const zoomMax = ref(1)
  const isZoomSupported = ref(false)
  const focusRipple = ref<TouchFocusPoint | null>(null)

  let stream: MediaStream | null = null
  let focusRippleTimer: ReturnType<typeof setTimeout> | null = null
  let pinchStartDistance = 0
  let pinchStartZoom = 1
  let isPinching = false

  function bindStream(mediaStream: MediaStream, options?: { defaultZoom?: number }): void {
    stream = mediaStream
    const caps = detectTrackCapabilities(mediaStream)
    isZoomSupported.value = caps.isZoomSupported
    zoomMin.value = caps.zoomMin
    zoomMax.value = caps.zoomMax
    zoomLevel.value = getCurrentZoom(mediaStream)

    if (options?.defaultZoom !== undefined && caps.isZoomSupported) {
      void setZoom(options.defaultZoom)
    }
  }

  function unbindStream(): void {
    stream = null
    zoomLevel.value = 1
    isZoomSupported.value = false
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
    focusRipple: readonly(focusRipple),
    bindStream,
    unbindStream,
    handleTouchFocus,
    setZoom,
    zoomIn,
    zoomOut,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onClick,
  }
}
