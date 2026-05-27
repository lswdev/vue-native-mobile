import type { App } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'

export function registerPlugins(app: App): void {
  app.use(createPinia())
  app.use(router)
}
