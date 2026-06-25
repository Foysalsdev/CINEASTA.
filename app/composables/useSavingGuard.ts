// Shared submit guard for every form. Blocks a second submit while one is
// already in flight, and marks the global UI busy flag so the containing
// modal can't be dismissed mid-save — the main way a duplicate entry could
// slip in (user bails out before the first request settles and resubmits).
export function useSavingGuard() {
  const ui = useUiStore()
  const saving = ref(false)

  async function guard(fn: () => Promise<void>) {
    if (saving.value) return
    saving.value = true
    ui.beginBusy()
    try {
      await fn()
    } finally {
      saving.value = false
      ui.endBusy()
    }
  }

  return { saving, guard }
}
