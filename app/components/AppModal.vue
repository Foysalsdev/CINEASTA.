<script setup lang="ts">
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const dragY = ref(0)
const dragging = ref(false)
let startY = 0

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

// Lock background scroll so only the sheet scrolls (one-hand friendly on iOS).
function lock() {
  document.documentElement.classList.add('is-locked')
}
function unlock() {
  document.documentElement.classList.remove('is-locked')
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  lock()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  unlock()
})

// --- Swipe-down-to-dismiss on the grabber / header ---
function onTouchStart(e: TouchEvent) {
  startY = e.touches[0]!.clientY
  dragging.value = true
}
function onTouchMove(e: TouchEvent) {
  if (!dragging.value) return
  const delta = e.touches[0]!.clientY - startY
  dragY.value = Math.max(0, delta)
}
function onTouchEnd() {
  dragging.value = false
  if (dragY.value > 120) emit('close')
  else dragY.value = 0
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <div
      class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      @click="emit('close')"
    />
    <div
      ref="panel"
      class="sheet relative flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      :style="{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? 'none' : undefined,
      }"
      role="dialog"
      aria-modal="true"
    >
      <!-- Grabber + header double as the swipe-down dismiss zone. -->
      <div
        class="shrink-0 cursor-grab touch-none px-5 pt-3"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-900">{{ props.title }}</h3>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable content; bottom padding clears the home indicator. -->
      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet {
  animation: sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@media (min-width: 640px) {
  @keyframes sheet-up {
    from {
      transform: translateY(16px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
</style>
