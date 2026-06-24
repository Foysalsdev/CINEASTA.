<script setup lang="ts">
defineProps<{
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
  icon?: string
}>()

const toneClasses: Record<string, string> = {
  default: 'text-gray-900',
  positive: 'text-brand-600',
  negative: 'text-red-600',
  warning: 'text-amber-600',
}
</script>

<template>
  <div class="card p-4">
    <p class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ label }}</p>
    <p class="mt-1 text-2xl font-bold" :class="toneClasses[tone || 'default']">{{ value }}</p>
    <p v-if="sub" class="mt-0.5 text-xs text-gray-400">{{ sub }}</p>
  </div>
</template>
