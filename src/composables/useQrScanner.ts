import { ref, readonly, onUnmounted } from 'vue'
import jsQR from 'jsqr'
import type { QrScanResult } from '@/types/camera.types'
import { requestUserMedia } from '@/utils/media.util'

const SCAN_INTERVAL_MS = 200

export function useQrScanner() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const isScanning = ref(false)
  const lastResult = ref<QrScanResult | null>(null)
  const error = ref<string | null>(null)

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
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      stream.value = mediaStream
      videoEl.srcObject = mediaStream
      await videoEl.play()
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
          onDetected(result)
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  function decodeFrame(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement): QrScanResult | null {
    if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) return null
    if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return null

    canvasEl.width = videoEl.videoWidth
    canvasEl.height = videoEl.videoHeight

    const ctx = canvasEl.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height)
    const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
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

  function resumeScan(
    onDetected: (result: QrScanResult) => void,
  ): void {
    if (!videoRef.value || !canvasRef.value || !stream.value) return
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
  }

  onUnmounted(() => {
    stopScan()
  })

  return {
    isScanning: readonly(isScanning),
    lastResult: readonly(lastResult),
    error: readonly(error),
    startScan,
    pauseScan,
    resumeScan,
    stopScan,
  }
}
