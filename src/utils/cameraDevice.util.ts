import type { CameraFacingMode } from '@/types/camera.types'
import { buildCameraVideoConstraints } from '@/utils/cameraConstraints.util'
import { requestUserMedia } from '@/utils/media.util'

interface ExtendedCapabilities {
  torch?: boolean
  facingMode?: string[]
  focusMode?: string[]
  focusDistance?: { min: number; max: number }
  zoom?: { min: number; max: number }
}

interface CameraDeviceScore {
  deviceId: string
  score: number
  hasTorch: boolean
}

const STORAGE_KEY = 'native_rear_camera_device_id'

let cachedRearDeviceId: string | null = null

function getCachedRearDeviceId(): string | null {
  if (cachedRearDeviceId) return cachedRearDeviceId
  try {
    cachedRearDeviceId = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    cachedRearDeviceId = null
  }
  return cachedRearDeviceId
}

function setCachedRearDeviceId(deviceId: string): void {
  cachedRearDeviceId = deviceId
  try {
    sessionStorage.setItem(STORAGE_KEY, deviceId)
  } catch {
    // sessionStorage unavailable
  }
}

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}

function scoreCameraDevice(
  device: MediaDeviceInfo,
  capabilities: ExtendedCapabilities,
): number {
  const label = device.label.toLowerCase()
  const torchSupport = capabilities.torch === true ? 1 : 0
  const isRear = capabilities.facingMode?.includes('environment') ? 1 : 0
  const hasContinuousFocus = capabilities.focusMode?.includes('continuous') ? 1 : 0
  const isMacroLens =
    capabilities.focusDistance && capabilities.focusDistance.max < 5 ? 1 : 0
  const isNotUltraWide =
    label.includes('ultra') || label.includes('0.6') || label.includes('uw') ? 0 : 1
  const zoomMin = capabilities.zoom?.min ?? 1
  const isMainLens = zoomMin >= 0.9 && zoomMin <= 1.2 ? 2 : 0
  const isUltraWideLens = zoomMin < 0.75 ? -3 : 0

  return (
    torchSupport * 5 +
    isRear * 2 +
    hasContinuousFocus +
    isMacroLens +
    isNotUltraWide * 2 +
    isMainLens +
    isUltraWideLens
  )
}

async function probeDevice(deviceId: string): Promise<CameraDeviceScore | null> {
  let stream: MediaStream | null = null

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    })

    const track = stream.getVideoTracks()[0]
    if (!track) return null

    const capabilities = (track.getCapabilities?.() ?? {}) as ExtendedCapabilities
    if (!capabilities.facingMode?.includes('environment')) return null

    const devices = await navigator.mediaDevices.enumerateDevices()
    const device = devices.find((entry) => entry.deviceId === deviceId)
    if (!device) return null

    return {
      deviceId,
      score: scoreCameraDevice(device, capabilities),
      hasTorch: capabilities.torch === true,
    }
  } catch {
    return null
  } finally {
    if (stream) stopStream(stream)
  }
}

async function validateCachedDevice(deviceId: string): Promise<boolean> {
  const probed = await probeDevice(deviceId)
  return probed?.hasTorch === true
}

async function findBestRearCameraDeviceId(): Promise<string | undefined> {
  const cached = getCachedRearDeviceId()
  if (cached && (await validateCachedDevice(cached))) {
    return cached
  }

  let tempStream: MediaStream | null = null

  try {
    tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })

    const tempTrack = tempStream.getVideoTracks()[0]
    const tempCaps = (tempTrack?.getCapabilities?.() ?? {}) as ExtendedCapabilities
    const tempSettings = tempTrack?.getSettings?.() as { deviceId?: string } | undefined

    if (tempCaps.torch === true && tempSettings?.deviceId) {
      setCachedRearDeviceId(tempSettings.deviceId)
      return tempSettings.deviceId
    }
  } catch {
    // fallback to enumeration
  } finally {
    if (tempStream) stopStream(tempStream)
  }

  const devices = await navigator.mediaDevices.enumerateDevices()
  const videoInputs = devices.filter((device) => device.kind === 'videoinput')

  let best: CameraDeviceScore | undefined

  for (const device of videoInputs) {
    const probed = await probeDevice(device.deviceId)
    if (!probed) continue

    if (!best || probed.score > best.score) {
      best = probed
    }
  }

  if (best?.hasTorch) {
    setCachedRearDeviceId(best.deviceId)
    return best.deviceId
  }

  return best?.deviceId
}

export async function requestCameraStream(facing: CameraFacingMode): Promise<MediaStream> {
  if (facing === 'user') {
    return requestUserMedia({
      video: buildCameraVideoConstraints('user'),
      audio: false,
    })
  }

  const deviceId = await findBestRearCameraDeviceId()

  return requestUserMedia({
    video: buildCameraVideoConstraints('environment', deviceId),
    audio: false,
  })
}

export function trackSupportsTorch(stream: MediaStream): boolean {
  const track = stream.getVideoTracks()[0]
  if (!track) return false

  const capabilities = (track.getCapabilities?.() ?? {}) as ExtendedCapabilities
  return capabilities.torch === true
}
