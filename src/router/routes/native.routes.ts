import type { RouteRecordRaw } from 'vue-router'

export const nativeRoutes: RouteRecordRaw[] = [
  {
    path: '/camera',
    name: 'camera',
    component: () => import('@/pages/camera/CameraPage.vue'),
    meta: { title: '카메라 촬영' },
  },
  {
    path: '/qr',
    name: 'qr-scan',
    component: () => import('@/pages/qr/QrPage.vue'),
    meta: { title: 'QR 코드 스캔' },
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('@/pages/upload/UploadPage.vue'),
    meta: { title: '이미지 업로드' },
  },
]
