export type ConsentStatus = 'granted' | 'denied'

export interface NativeConsentState {
  camera: ConsentStatus | null
  image: ConsentStatus | null
}

export type ConsentStep = 'camera' | 'image'
