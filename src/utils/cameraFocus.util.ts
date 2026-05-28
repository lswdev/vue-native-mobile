import type { TouchFocusPoint } from '@/types/camera.types'

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[]
  pointsOfInterest?: unknown
  torch?: boolean
  zoom?: { min: number; max: number; step?: number }
  focusDistance?: { min: number; max: number; step?: number }
  exposureCompensation?: { min: number; max: number; step?: number }
}

export interface TrackCapabilities {
  isFocusSupported: boolean
  isTorchSupported: boolean
  isZoomSupported: boolean
  isBrightnessSupported: boolean
  zoomMin: number
  zoomMax: number
  zoomStep: number
  brightnessMin: number
  brightnessMax: number
  brightnessStep: number
}

export interface ScanCropRegion {
  sx: number
  sy: number
  sw: number
  sh: number
}

function getTrack(stream: MediaStream): MediaStreamTrack | null {
  return stream.getVideoTracks()[0] ?? null
}

function getCapabilities(track: MediaStreamTrack): ExtendedMediaTrackCapabilities {
  return (track.getCapabilities?.() ?? {}) as ExtendedMediaTrackCapabilities
}

export function detectTrackCapabilities(stream: MediaStream): TrackCapabilities {
  const track = getTrack(stream)
  if (!track) {
    return {
      isFocusSupported: false,
      isTorchSupported: false,
      isZoomSupported: false,
      isBrightnessSupported: false,
      zoomMin: 1,
      zoomMax: 1,
      zoomStep: 0.1,
      brightnessMin: 0,
      brightnessMax: 0,
      brightnessStep: 0.1,
    }
  }

  const capabilities = getCapabilities(track)
  const zoom = capabilities.zoom
  const exposure = capabilities.exposureCompensation

  return {
    isFocusSupported: 'focusMode' in capabilities || 'pointsOfInterest' in capabilities,
    isTorchSupported: capabilities.torch === true,
    isZoomSupported: !!zoom && zoom.max > zoom.min,
    isBrightnessSupported: !!exposure && exposure.max > exposure.min,
    zoomMin: zoom?.min ?? 1,
    zoomMax: zoom?.max ?? 1,
    zoomStep: zoom?.step ?? 0.1,
    brightnessMin: exposure?.min ?? 0,
    brightnessMax: exposure?.max ?? 0,
    brightnessStep: exposure?.step ?? 0.1,
  }
}

export function getCurrentZoom(stream: MediaStream): number {
  const track = getTrack(stream)
  if (!track) return 1

  const settings = track.getSettings?.() as { zoom?: number } | undefined
  return settings?.zoom ?? 1
}

async function tryApplyConstraints(
  track: MediaStreamTrack,
  constraints: MediaTrackConstraints,
): Promise<boolean> {
  try {
    await track.applyConstraints(constraints)
    return true
  } catch {
    return false
  }
}

export async function applyContinuousAutofocus(stream: MediaStream): Promise<void> {
  const track = getTrack(stream)
  if (!track) return

  const focusModes = getCapabilities(track).focusMode ?? []

  if (focusModes.includes('continuous')) {
    await tryApplyConstraints(track, { focusMode: 'continuous' } as MediaTrackConstraints)
    await tryApplyConstraints(track, {
      advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
    })
  }
}

export async function applyTouchFocus(
  stream: MediaStream,
  point: TouchFocusPoint,
  videoEl: HTMLVideoElement,
): Promise<void> {
  const track = getTrack(stream)
  if (!track) return

  const rect = videoEl.getBoundingClientRect()
  const relX = Math.min(1, Math.max(0, (point.x - rect.left) / rect.width))
  const relY = Math.min(1, Math.max(0, (point.y - rect.top) / rect.height))
  const focusModes = getCapabilities(track).focusMode ?? []

  // 1) single-shot 재트리거 (Android Chrome에서 가장 잘 동작)
  if (focusModes.includes('single-shot')) {
    await tryApplyConstraints(track, { focusMode: 'single-shot' } as MediaTrackConstraints)
    await tryApplyConstraints(track, {
      advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraintSet],
    })
  }

  // 2) pointsOfInterest + manual
  await tryApplyConstraints(track, {
    advanced: [
      {
        focusMode: 'manual',
        pointsOfInterest: [{ x: relX, y: relY }],
      } as MediaTrackConstraintSet,
    ],
  })

  await tryApplyConstraints(track, {
    advanced: [{ pointsOfInterest: [{ x: relX, y: relY }] } as MediaTrackConstraintSet],
  })

  // 3) 근거리 촬영 시 focusDistance 보정 (지원 기기)
  const focusDistance = getCapabilities(track).focusDistance
  if (focusDistance) {
    const nearFocus = Math.min(focusDistance.max, focusDistance.min + (focusDistance.max - focusDistance.min) * 0.15)
    await tryApplyConstraints(track, {
      advanced: [{ focusDistance: nearFocus } as MediaTrackConstraintSet],
    })
  }

  // 4) 지연 후 single-shot 재시도 (렌즈 이동 시간 확보)
  await delay(180)

  if (focusModes.includes('single-shot')) {
    await tryApplyConstraints(track, { focusMode: 'single-shot' } as MediaTrackConstraints)
  } else if (focusModes.includes('continuous')) {
    await tryApplyConstraints(track, { focusMode: 'continuous' } as MediaTrackConstraints)
  }
}

export function getCurrentBrightness(stream: MediaStream): number {
  const track = getTrack(stream)
  if (!track) return 0

  const settings = track.getSettings?.() as { exposureCompensation?: number } | undefined
  return settings?.exposureCompensation ?? 0
}

export async function applyTorch(stream: MediaStream, enabled: boolean): Promise<boolean> {
  const track = getTrack(stream)
  if (!track) return false

  const capabilities = getCapabilities(track)
  if (capabilities.torch !== true) return false

  const attempts: MediaTrackConstraints[] = [
    { torch: enabled } as MediaTrackConstraints,
    { advanced: [{ torch: enabled } as MediaTrackConstraintSet] },
    {
      advanced: [{ torch: enabled, zoom: getCurrentZoom(stream) } as MediaTrackConstraintSet],
    },
  ]

  for (const constraints of attempts) {
    try {
      await track.applyConstraints(constraints)

      await delay(80)

      const settings = track.getSettings?.() as { torch?: boolean } | undefined
      if (settings?.torch === enabled) return true
    } catch {
      continue
    }
  }

  // 일부 삼성 기기는 getSettings() 반영이 늦지만 실제 플래시는 켜짐
  try {
    await track.applyConstraints({ torch: enabled } as MediaTrackConstraints)
    return true
  } catch {
    return false
  }
}

export async function applyBrightness(stream: MediaStream, value: number): Promise<number> {
  const track = getTrack(stream)
  if (!track) return 0

  const { brightnessMin, brightnessMax, brightnessStep, isBrightnessSupported } =
    detectTrackCapabilities(stream)
  if (!isBrightnessSupported) return getCurrentBrightness(stream)

  const stepped = Math.round(value / brightnessStep) * brightnessStep
  const clamped = Math.min(brightnessMax, Math.max(brightnessMin, stepped))

  const applied =
    (await tryApplyConstraints(track, {
      exposureCompensation: clamped,
    } as MediaTrackConstraints)) ||
    (await tryApplyConstraints(track, {
      advanced: [{ exposureCompensation: clamped } as MediaTrackConstraintSet],
    }))

  if (!applied) return getCurrentBrightness(stream)
  return getCurrentBrightness(stream)
}

export async function applyZoom(stream: MediaStream, zoom: number): Promise<number> {
  const track = getTrack(stream)
  if (!track) return 1

  const { zoomMin, zoomMax, zoomStep } = detectTrackCapabilities(stream)
  if (zoomMax <= zoomMin) return getCurrentZoom(stream)

  const clamped = Math.min(zoomMax, Math.max(zoomMin, zoom))
  const stepped = Math.round(clamped / zoomStep) * zoomStep
  const candidates = Array.from(new Set([clamped, stepped]))

  for (const value of candidates) {
    const applied =
      (await tryApplyConstraints(track, { zoom: value } as MediaTrackConstraints)) ||
      (await tryApplyConstraints(track, {
        advanced: [{ zoom: value } as MediaTrackConstraintSet],
      }))

    if (!applied) continue

    const current = getCurrentZoom(stream)
    if (Math.abs(current - value) <= Math.max(zoomStep, 0.25)) {
      return current
    }
  }

  return getCurrentZoom(stream)
}

export function getScanCropRegion(videoEl: HTMLVideoElement, cropRatio = 0.72): ScanCropRegion {
  const videoWidth = videoEl.videoWidth
  const videoHeight = videoEl.videoHeight
  const elementWidth = videoEl.clientWidth
  const elementHeight = videoEl.clientHeight

  if (!videoWidth || !videoHeight || !elementWidth || !elementHeight) {
    const size = Math.min(videoWidth, videoHeight) * cropRatio
    return {
      sx: (videoWidth - size) / 2,
      sy: (videoHeight - size) / 2,
      sw: size,
      sh: size,
    }
  }

  const videoRatio = videoWidth / videoHeight
  const elementRatio = elementWidth / elementHeight

  let visibleWidth: number
  let visibleHeight: number
  let offsetX: number
  let offsetY: number

  if (videoRatio > elementRatio) {
    visibleHeight = videoHeight
    visibleWidth = videoHeight * elementRatio
    offsetX = (videoWidth - visibleWidth) / 2
    offsetY = 0
  } else {
    visibleWidth = videoWidth
    visibleHeight = videoWidth / elementRatio
    offsetX = 0
    offsetY = (videoHeight - visibleHeight) / 2
  }

  const cropSize = Math.min(visibleWidth, visibleHeight) * cropRatio

  return {
    sx: offsetX + (visibleWidth - cropSize) / 2,
    sy: offsetY + (visibleHeight - cropSize) / 2,
    sw: cropSize,
    sh: cropSize,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 하위 호환
export function detectFocusCapabilities(stream: MediaStream): {
  isFocusSupported: boolean
  isTorchSupported: boolean
} {
  const caps = detectTrackCapabilities(stream)
  return { isFocusSupported: caps.isFocusSupported, isTorchSupported: caps.isTorchSupported }
}
