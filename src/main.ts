import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n, applyLocale } from './i18n'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(i18n)

useAuthStore(pinia).initAuth()

app.mount('#app')

applyLocale(i18n.global.locale.value)