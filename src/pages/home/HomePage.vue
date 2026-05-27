<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface NavItem {
  label: string
  description: string
  icon: string
  route: string
  color: string
}

const navItems: NavItem[] = [
  {
    label: '카메라 촬영',
    description: '터치 포커스 지원 디바이스 카메라',
    icon: 'camera',
    route: '/camera',
    color: '#3b82f6',
  },
  {
    label: 'QR 코드 스캔',
    description: '실시간 QR 코드 인식',
    icon: 'qr',
    route: '/qr',
    color: '#8b5cf6',
  },
  {
    label: '이미지 업로드',
    description: '카메라 촬영 또는 갤러리에서 선택',
    icon: 'upload',
    route: '/upload',
    color: '#10b981',
  },
]
</script>

<template>
  <div class="home-page">
    <header class="home-page__header">
      <h1 class="home-page__title">Native Features</h1>
      <p class="home-page__subtitle">모바일 네이티브 기능 데모</p>
    </header>

    <main class="home-page__main">
      <div
        v-for="item in navItems"
        :key="item.route"
        class="home-page__nav-card"
        role="button"
        tabindex="0"
        :aria-label="item.label"
        @click="router.push(item.route)"
        @keydown.enter="router.push(item.route)"
      >
        <div
          class="home-page__nav-icon"
          :style="{ backgroundColor: `${item.color}1a`, color: item.color }"
        >
          <svg v-if="item.icon === 'camera'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <svg v-else-if="item.icon === 'qr'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h3v3M17 17h3v3M14 20h3"/>
          </svg>
          <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="home-page__nav-text">
          <p class="home-page__nav-label">{{ item.label }}</p>
          <p class="home-page__nav-desc">{{ item.description }}</p>
        </div>
        <svg class="home-page__nav-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100dvh;
  background: var(--color-surface);
  padding: max(env(safe-area-inset-top), 1.5rem) 1.25rem max(env(safe-area-inset-bottom), 1.5rem);
}

.home-page__header {
  padding: 1.5rem 0 2rem;
}

.home-page__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.home-page__subtitle {
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.home-page__main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.home-page__nav-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  outline: none;
}

.home-page__nav-card:active {
  background: var(--color-surface-raised);
}

.home-page__nav-card:focus-visible {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
}

.home-page__nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.home-page__nav-text {
  flex: 1;
  min-width: 0;
}

.home-page__nav-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.home-page__nav-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-top: 0.125rem;
}

.home-page__nav-arrow {
  color: var(--color-text-disabled);
  flex-shrink: 0;
}
</style>
