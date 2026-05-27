export function isSecureMediaContext(): boolean {
  return window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

export function getMediaAccessErrorMessage(): string {
  if (window.isSecureContext) {
    return '카메라 접근에 실패했습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.'
  }

  return [
    '모바일 브라우저는 HTTP(IP 주소) 접속에서 카메라를 사용할 수 없습니다.',
    'https://PC_IP:5326 으로 접속하거나,',
    'Android는 USB 연결 후 adb reverse tcp:5326 tcp:5326 → http://localhost:5326',
  ].join('\n')
}

export async function requestUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (!isSecureMediaContext()) {
    throw new Error(getMediaAccessErrorMessage())
  }

  return navigator.mediaDevices.getUserMedia(constraints)
}
