<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string }>()
</script>

<template>
  <section class="card p-4">
    <header v-if="title || $slots.action" class="mb-3 flex items-center justify-between gap-2">
      <div>
        <h2 v-if="title" class="text-sm font-semibold text-gray-900">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-gray-400">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>
