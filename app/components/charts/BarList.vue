<script setup lang="ts">
interface Bar {
  label: string
  value: number
  sub?: string
}
const props = defineProps<{ data: Bar[]; color?: string }>()
const { currency } = useFormat()
const max = computed(() => Math.max(1, ...props.data.map((d) => Math.abs(d.value))))
</script>

<template>
  <ul class="space-y-2.5">
    <li v-for="d in data" :key="d.label">
      <div class="mb-1 flex items-center justify-between gap-2 text-sm">
        <span class="truncate font-medium text-gray-700">{{ d.label }}</span>
        <span class="shrink-0 tabular-nums" :class="d.value < 0 ? 'text-red-600' : 'text-gray-900'">
          {{ currency(d.value, { compact: true }) }}
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full"
          :style="{
            width: `${(Math.abs(d.value) / max) * 100}%`,
            background: d.value < 0 ? '#dc2626' : color || '#176a3a',
          }"
        />
      </div>
      <p v-if="d.sub" class="mt-0.5 text-xs text-gray-400">{{ d.sub }}</p>
    </li>
  </ul>
</template>
