<script setup lang="ts">
interface Slice {
  label: string
  value: number
  color: string
}
const props = defineProps<{ data: Slice[] }>()
const { currency } = useFormat()

const total = computed(() => props.data.reduce((a, s) => a + s.value, 0))

const segments = computed(() => {
  const C = 2 * Math.PI * 42 // circumference for r=42
  let offset = 0
  return props.data
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = total.value ? s.value / total.value : 0
      const seg = { ...s, dash: frac * C, gap: C - frac * C, offset: -offset * C, frac }
      offset += frac
      return seg
    })
})
</script>

<template>
  <div class="flex items-center gap-4">
    <svg viewBox="0 0 100 100" class="h-28 w-28 shrink-0 -rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" stroke-width="14" />
      <circle
        v-for="seg in segments"
        :key="seg.label"
        cx="50"
        cy="50"
        r="42"
        fill="none"
        :stroke="seg.color"
        stroke-width="14"
        :stroke-dasharray="`${seg.dash} ${seg.gap}`"
        :stroke-dashoffset="seg.offset"
      />
    </svg>
    <ul class="flex-1 space-y-1.5">
      <li v-for="s in data" :key="s.label" class="flex items-center justify-between gap-2 text-sm">
        <span class="inline-flex items-center gap-2 text-gray-600">
          <span class="h-2.5 w-2.5 rounded-sm" :style="{ background: s.color }" />{{ s.label }}
        </span>
        <span class="font-medium text-gray-900">{{ currency(s.value, { compact: true }) }}</span>
      </li>
    </ul>
  </div>
</template>
