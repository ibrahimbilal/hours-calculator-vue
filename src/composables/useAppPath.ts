import { computed, onMounted, onUnmounted, ref } from 'vue'

const PUBLIC_PATHS = ['/privacy', '/home'] as const

function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/'
}

export function useAppPath() {
  const path = ref(normalizePath(window.location.pathname))

  function syncPath(): void {
    path.value = normalizePath(window.location.pathname)
  }

  onMounted(() => {
    window.addEventListener('popstate', syncPath)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', syncPath)
  })

  const isPrivacyPage = computed(() => path.value === '/privacy')
  const isHomePage = computed(() => path.value === '/home')
  const isPublicPage = computed(() =>
    (PUBLIC_PATHS as readonly string[]).includes(path.value),
  )

  return { path, isPrivacyPage, isHomePage, isPublicPage, syncPath }
}