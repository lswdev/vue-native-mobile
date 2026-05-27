import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
  }
}

// ImageCapture API 타입 보강 (일부 브라우저 미지원 타입 보완)
interface MediaTrackCapabilities {
  focusMode?: string[]
  pointsOfInterest?: unknown
  torch?: boolean
}

interface ConstrainPoint2DParameters {
  x: number
  y: number
}

interface MediaTrackConstraintSet {
  focusMode?: string | string[]
  pointsOfInterest?: ConstrainPoint2DParameters[]
  torch?: boolean
}
