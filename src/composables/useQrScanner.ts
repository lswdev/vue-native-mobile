import { ref, readonly, onUnmounted } from 'vue'
import jsQR from 'jsqr'
import type { QrScanResult } from '@/types/camera.types'
import { useCameraTrack } from '@/composables/useCameraTrack'
import { requestUserMedia } from '@/utils/media.util'
import { applyContinuousAutofocus, getScanCropRegion } from '@/utils/cameraFocus.util'

const SCAN_INTERVAL_MS = 120
const DECODE_MAX_SIZE = 960
const DEFAULT_QR_ZOOM = 1.8

export function useQrScanner() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const isScanning = ref(false)
  const lastResult = ref<QrScanResult | null>(null)
  const error = ref<string | null>(null)

  const trackControls = useCameraTrack()

  let rafId: number | null = null
  let lastScanTime = 0

  async function startScan(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    onDetected: (result: QrScanResult) => void,
  ): Promise<void> {
    error.value = null
    videoRef.value = videoEl
    canvasRef.value = canvasEl

    try {
      const mediaStream = await requestUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: { ideal: 'continuous' },
        } as MediaTrackConstraints,
        audio: false,
      })

      stream.value = mediaStream
      videoEl.srcObject = mediaStream
      await videoEl.play()

      await applyContinuousAutofocus(mediaStream)
      trackControls.bindStream(mediaStream, { defaultZoom: DEFAULT_QR_ZOOM })

      isScanning.value = true
      scanLoop(videoEl, canvasEl, onDetected)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'QR 스캔 카메라 접근에 실패했습니다.'
      isScanning.value = false
    }
  }

  function scanLoop(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    onDetected: (result: QrScanResult) => void,
  ): void {
    const tick = (timestamp: number): void => {
      if (!isScanning.value) return

      if (timestamp - lastScanTime >= SCAN_INTERVAL_MS) {
        lastScanTime = timestamp
        const result = decodeFrame(videoEl, canvasEl)
        if (result) {
          lastResult.value = result
          pauseScan()
          onDetected(result)
          return
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  function decodeFrame(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement): QrScanResult | null {
    if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) return null
    if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return null

    const ctx = canvasEl.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const cropRegion = getScanCropRegion(videoEl, 0.65)
    const scale = Math.min(1, DECODE_MAX_SIZE / Math.max(cropRegion.sw, cropRegion.sh))
    const outputWidth = Math.round(cropRegion.sw * scale)
    const outputHeight = Math.round(cropRegion.sh * scale)

    canvasEl.width = outputWidth
    canvasEl.height = outputHeight

    ctx.drawImage(
      videoEl,
      cropRegion.sx,
      cropRegion.sy,
      cropRegion.sw,
      cropRegion.sh,
      0,
      0,
      outputWidth,
      outputHeight,
    )

    const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight)

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })

    if (!code) return null

    return {
      data: code.data,
      location: {
        topLeftCorner: code.location.topLeftCorner,
        topRightCorner: code.location.topRightCorner,
        bottomLeftCorner: code.location.bottomLeftCorner,
        bottomRightCorner: code.location.bottomRightCorner,
      },
    }
  }

  function pauseScan(): void {
    isScanning.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function resumeScan(onDetected: (result: QrScanResult) => void): void {
    if (!videoRef.value || !canvasRef.value || !stream.value) return
    lastResult.value = null
    isScanning.value = true
    scanLoop(videoRef.value, canvasRef.value, onDetected)
  }

  function stopScan(): void {
    pauseScan()
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
      stream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    lastResult.value = null
    trackControls.unbindStream()
  }

  onUnmounted(() => {
    stopScan()
  })

  return {
    isScanning: readonly(isScanning),
    lastResult: readonly(lastResult),
    error: readonly(error),
    focusRipple: trackControls.focusRipple,
    zoomLevel: trackControls.zoomLevel,
    zoomMin: trackControls.zoomMin,
    zoomMax: trackControls.zoomMax,
    isZoomSupported: trackControls.isZoomSupported,
    startScan,
    pauseScan,
    resumeScan,
    stopScan,
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
