<script setup lang="ts">
// Searchable combobox / typeahead used instead of native <select>.
//  - mode="select": value must be one of the options (e.g. pick a project);
//    typing filters the list, a small search icon sits in the field.
//  - mode="free":   value is whatever the user types (e.g. a variable expense
//    category); matching past entries are suggested as you type.
interface Option {
  value: string
  label: string
  hint?: string
}
const props = withDefaults(
  defineProps<{
    modelValue: string
    options: Option[]
    mode?: 'select' | 'free'
    placeholder?: string
  }>(),
  { mode: 'select', placeholder: 'Search…' },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const root = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref('')

function labelFor(val: string): string {
  if (props.mode === 'free') return val
  return props.options.find((o) => o.value === val)?.label ?? ''
}

// Keep the visible text in sync with the bound value (and late-loading options).
watch(
  [() => props.modelValue, () => props.options],
  () => {
    if (!open.value) query.value = labelFor(props.modelValue)
  },
  { immediate: true },
)

const filtered = computed<Option[]>(() => {
  const q = query.value.trim().toLowerCase()
  const selectedLabel = labelFor(props.modelValue).toLowerCase()
  // When the field still shows the current selection, reveal the whole list.
  const effective = props.mode === 'select' && q === selectedLabel ? '' : q
  if (!effective) return props.options.slice(0, 50)
  return props.options
    .filter(
      (o) =>
        o.label.toLowerCase().includes(effective) ||
        (o.hint ?? '').toLowerCase().includes(effective),
    )
    .slice(0, 50)
})

// In free mode, show whether the typed value is new (will be created).
const isNewFree = computed(
  () =>
    props.mode === 'free' &&
    query.value.trim().length > 0 &&
    !props.options.some((o) => o.label.toLowerCase() === query.value.trim().toLowerCase()),
)

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  if (props.mode === 'free') emit('update:modelValue', query.value.trim())
}

function choose(o: Option) {
  query.value = o.label
  emit('update:modelValue', o.value)
  open.value = false
  inputEl.value?.blur()
}

function onFocus() {
  open.value = true
  // Select-all so the first keystroke replaces the shown selection.
  requestAnimationFrame(() => inputEl.value?.select())
}

function onEnter() {
  if (filtered.value.length) choose(filtered.value[0]!)
  else if (props.mode === 'free') open.value = false
}

function close() {
  open.value = false
  // select mode: revert partial text that doesn't match a real option.
  if (props.mode === 'select') query.value = labelFor(props.modelValue)
}

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) close()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <div class="relative">
      <!-- search icon -->
      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" stroke-linecap="round" />
        </svg>
      </span>
      <input
        ref="inputEl"
        :value="query"
        class="field-input !pl-9"
        :placeholder="placeholder"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        @focus="onFocus"
        @input="onInput"
        @keydown.enter.prevent="onEnter"
        @keydown.esc="close"
      />
    </div>

    <!-- suggestions -->
    <ul
      v-if="open && (filtered.length || isNewFree)"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200"
    >
      <li
        v-for="o in filtered"
        :key="o.value"
        class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-brand-50 active:bg-brand-100"
        @mousedown.prevent="choose(o)"
      >
        <span class="truncate font-medium text-gray-800">{{ o.label }}</span>
        <span v-if="o.hint" class="shrink-0 text-xs text-gray-400">{{ o.hint }}</span>
      </li>
      <li
        v-if="isNewFree"
        class="px-3 py-2 text-xs text-gray-400"
      >
        Press Enter to use “<span class="font-medium text-gray-600">{{ query.trim() }}</span>”
      </li>
    </ul>
  </div>
</template>
