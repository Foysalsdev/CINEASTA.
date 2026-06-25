<script setup lang="ts">
import type { Attachment } from '~/types'

const model = defineModel<Attachment[]>({ default: () => [] })
const ui = useUiStore()
const { upload } = useUploads()

const fileEl = ref<HTMLInputElement | null>(null)
const busy = ref(false)

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // allow re-picking the same file
  if (!files.length) return
  busy.value = true
  try {
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        ui.toast(`${f.name} is over 8MB`, 'error')
        continue
      }
      const att = await upload(f)
      model.value = [...model.value, att]
    }
  } catch (err) {
    ui.toast(err instanceof Error ? err.message : 'Upload failed', 'error')
  } finally {
    busy.value = false
  }
}

function remove(id: string) {
  model.value = model.value.filter((a) => a.id !== id)
}
function isImage(a: Attachment) {
  return a.mime?.startsWith('image/')
}
</script>

<template>
  <div>
    <label class="field-label">Receipts / attachments</label>
    <input
      ref="fileEl"
      type="file"
      class="hidden"
      accept="image/*,application/pdf"
      capture="environment"
      multiple
      @change="onPick"
    />

    <div class="flex flex-wrap items-center gap-2">
      <a
        v-for="a in model"
        :key="a.id"
        :href="a.url"
        target="_blank"
        rel="noopener"
        class="group relative flex items-center gap-1.5 rounded-lg bg-gray-100 py-1.5 pl-2 pr-7 text-xs text-gray-700"
      >
        <img v-if="isImage(a)" :src="a.url" class="h-5 w-5 rounded object-cover" alt="" />
        <svg v-else viewBox="0 0 24 24" class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3v5h5M7 3h8l5 5v13H7z" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span class="max-w-[120px] truncate">{{ a.name }}</span>
        <button
          type="button"
          class="absolute right-1 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-gray-300 text-white"
          aria-label="Remove"
          @click.prevent="remove(a.id)"
        >
          <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" /></svg>
        </button>
      </a>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 active:scale-95"
        :disabled="busy"
        @click="fileEl?.click()"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round" /></svg>
        {{ busy ? 'Uploading…' : 'Add receipt' }}
      </button>
    </div>
  </div>
</template>
