// Gate every route behind the passcode login. Runs client-side (SPA).
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  auth.restore()

  const isLogin = to.path === '/login'

  if (!auth.authed && !isLogin) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (auth.authed && isLogin) {
    return navigateTo('/')
  }
})
