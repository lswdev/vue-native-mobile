import type { CameraFacingMode } from '@/types/camera.types'

export function buildCameraVideoConstraints(
  facing: CameraFacingMode,
  deviceId?: string,
): MediaTrackConstraints {
  const base = {
    facingMode: deviceId ? undefined : { ideal: facing },
    deviceId: deviceId ? { exact: deviceId } : undefined,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    focusMode: { ideal: 'continuous' },
  } as MediaTrackConstraints

  if (facing === 'environment') {
    return base
  }

  return base
}
