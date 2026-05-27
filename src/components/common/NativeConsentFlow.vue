<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { ConsentStatus, ConsentStep } from '@/types/consent.types'

interface Props {
  step: ConsentStep
}

const props = defineProps<Props>()

const emit = defineEmits<{
  resolve: [step: ConsentStep, status: ConsentStatus]
}>()

const stepConfig = computed(() => {
  if (props.step === 'camera') {
    return {
      icon: 'camera' as const,
      title: '카메라 사용 동의',
      description:
        'QR 코드 스캔 및 사진 촬영 기능을 위해 기기 카메라에 접근합니다. 촬영된 이미지는 서비스 제공 목적으로만 사용됩니다.',
    }
  }

  return {
    icon: 'image' as const,
    title: '이미지 첨부 동의',
    description:
      '갤러리에서 이미지를 선택하거나 촬영한 사진을 서버로 전송합니다. 선택한 이미지는 업로드 및 서비스 처리 목적으로만 사용됩니다.',
  }
})

function handleResolve(status: ConsentStatus): void {
  emit('resolve', props.step, status)
}

onMounted(() => {
  document.body.classList.add('native-consent-open')
})

onUnmounted(() => {
  document.body.classList.remove('native-consent-open')
})
</script>

<template>
  <Teleport to="body">
    <div class="native-consent" role="presentation">
      <div class="native-consent__backdrop" />

      <div
        class="native-consent__sheet"
        role="alertdialog"
        :aria-labelledby="`consent-title-${step}`"
        :aria-describedby="`consent-desc-${step}`"
      >
        <div class="native-consent__handle" aria-hidden="true" />

        <div class="native-consent__icon-wrap">
          <svg
            v-if="stepConfig.icon === 'camera'"
            class="native-consent__icon"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <svg
            v-else
            class="native-consent__icon"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        <h2 :id="`consent-title-${step}`" class="native-consent__title">
          {{ stepConfig.title }}
        </h2>
        <p :id="`consent-desc-${step}`" class="native-consent__description">
          {{ stepConfig.description }}
        </p>

        <p class="native-consent__notice">
          동의하지 않아도 앱을 이용할 수 있으나, 해당 기능은 사용할 수 없습니다.
        </p>

        <div class="native-consent__actions">
          <button
            type="button"
            class="native-consent__btn native-consent__btn--secondary"
            @click="handleResolve('denied')"
          >
            거부
          </button>
          <button
            type="button"
            class="native-consent__btn native-consent__btn--primary"
            @click="handleResolve('granted')"
          >
            허용
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.native-consent {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.native-consent__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  animation: native-consent-fade-in 0.25s ease;
}

.native-consent__sheet {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 0.5rem 1.25rem max(env(safe-area-inset-bottom), 1.25rem);
  background: var(--color-surface);
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
  animation: native-consent-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.native-consent__handle {
  width: 2.5rem;
  height: 0.25rem;
  margin: 0.5rem auto 1rem;
  border-radius: 9999px;
  background: var(--color-border);
}

.native-consent__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 1rem;
  background: var(--color-primary-50);
  color: var(--color-primary);
}

.native-consent__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
  letter-spacing: -0.02em;
}

.native-consent__description {
  margin-top: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  text-align: center;
}

.native-consent__notice {
  margin-top: 0.875rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-text-secondary);
  text-align: center;
  background: var(--color-surface-raised);
  border-radius: 0.5rem;
}

.native-consent__actions {
  display: flex;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

.native-consent__btn {
  flex: 1;
  height: 3rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.native-consent__btn:active {
  transform: scale(0.98);
}

.native-consent__btn--secondary {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.native-consent__btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.native-consent__btn--primary:active {
  background: var(--color-primary-700);
}

@keyframes native-consent-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes native-consent-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
