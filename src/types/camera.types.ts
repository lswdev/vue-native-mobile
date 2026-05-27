export interface CapturedImage {
  file: File
  dataUrl: string
  width: number
  height: number
  timestamp: number
}

export interface CameraConstraints {
  facingMode: 'environment' | 'user'
  width?: number
  height?: number
}

export interface TouchFocusPoint {
  x: number
  y: number
}

export type CameraFacingMode = 'environment' | 'user'

export interface QrScanResult {
  data: string
  location: {
    topLeftCorner: { x: number; y: number }
    topRightCorner: { x: number; y: number }
    bottomLeftCorner: { x: number; y: number }
    bottomRightCorner: { x: number; y: number }
  }
}

export interface UploadPayload {
  file: File
  fieldName: string
  extraData?: Record<string, string>
}
