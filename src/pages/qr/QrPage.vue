<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import QrScanner from '@/components/common/QrScanner.vue'
import { useCameraStore } from '@/stores/camera.store'
import type { QrScanResult } from '@/types/camera.types'

const router = useRouter()
const cameraStore = useCameraStore()

const isScannerOpen = ref(false)

function handleQrDetected(result: QrScanResult): void {
  cameraStore.addQrResult(result)
  isScannerOpen.value = false
}

function isUrl(text: string): boolean {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}
</script>

<template>
  <div class="qr-page">
    <!-- QR 스캐너 오버레이 -->
    <Teleport to="body">
      <Transition name="fade">
        <QrScanner
          v-if="isScannerOpen"
          @qr-detected="handleQrDetected"
          @close="isScannerOpen = false"
        />
      </Transition>
    </Teleport>

    <header class="qr-page__header">
      <button class="qr-page__back-btn" aria-label="뒤로 가기" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="qr-page__title">QR 코드 스캔</h1>
    </header>

    <main class="qr-page__main">
      <button class="qr-page__scan-btn" @click="isScannerOpen = true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <path d="M14 14h3v3M17 17h3v3M14 20h3"/>
        </svg>
        <span>QR 스캔 시작</span>
      </button>

      <!-- 스캔 히스토리 -->
      <div v-if="cameraStore.qrHistory.length > 0" class="qr-page__history">
        <div class="qr-page__history-header">
          <p class="qr-page__history-title">스캔 기록</p>
          <button class="qr-page__clear-btn" @click="cameraStore.clearQrHistory()">
            초기화
          </button>
        </div>
        <div class="qr-page__history-list">
          <div
            v-for="(item, index) in cameraStore.qrHistory"
            :key="index"
            class="qr-page__history-item"
          >
            <svg class="qr-page__history-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <p class="qr-page__history-data">{{ item.data }}</p>
            <a
              v-if="isUrl(item.data)"
              :href="item.data"
              target="_blank"
              rel="noopener noreferrer"
              class="qr-page__history-link"
              aria-label="링크 열기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <p v-else class="qr-page__empty">
        스캔 기록이 없습니다
      </p>
    </main>
  </div>
</template>

<style scoped>
.qr-page {
  min-height: 100dvh;
  background: var(--color-surface);
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
}

.qr-page__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: max(env(safe-area-inset-top), 1rem) 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.qr-page__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--color-text-primary);
}

.qr-page__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.qr-page__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1.25rem;
}

.qr-page__scan-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: #8b5cf6;
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

.qr-page__scan-btn:active {
  transform: scale(0.97);
  background: #7c3aed;
}

.qr-page__history {
  width: 100%;
  max-width: 480px;
}

.qr-page__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.qr-page__history-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.qr-page__clear-btn {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.qr-page__history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qr-page__history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

.qr-page__history-icon {
  color: #8b5cf6;
  flex-shrink: 0;
}

.qr-page__history-data {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  word-break: break-all;
}

.qr-page__history-link {
  color: var(--color-primary);
  flex-shrink: 0;
  display: flex;
}

.qr-page__empty {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
