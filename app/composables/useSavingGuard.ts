// Shared submit guard for every form. Blocks a second submit while one is
// already in flight, and marks the global UI busy flag so the containing
// modal can't be dismissed mid-save. `saving` is only reset on failure — on
// success the caller closes the form (emit 'saved'/'done'), and the form is
// about to unmount, so a stray tap landing before that unmount finishes
// (slow device, modal transition) must still be a no-op instead of firing a
// second, genuinely separate create call and double-adding the record.
export function useSavingGuard() {
  const ui = useUiStore()
  const saving = ref(false)

  async function guard(fn: () => Promise<void>) {
    if (saving.value) return
    saving.value = true
    ui.beginBusy()
    let ok = false
    try {
      await fn()
      ok = true
    } finally {
      ui.endBusy()
      if (!ok) saving.value = false
    }
  }

  return { saving, guard }
}
