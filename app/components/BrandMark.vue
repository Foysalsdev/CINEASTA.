<script setup lang="ts">
// Renders the official CINEASTA logo (Logo-4.png). `size` controls the height
// in px; width scales automatically. `withWordmark` is kept for call-site
// compatibility (the logo already contains the wordmark).
withDefaults(defineProps<{ size?: number; withWordmark?: boolean }>(), {
  size: 28,
  withWordmark: true,
})
</script>

<template>
  <img
    src="/icons/Logo-4.png"
    alt="CINEASTA."
    :style="{ height: `${size}px`, width: 'auto' }"
    class="select-none object-contain"
    draggable="false"
  />
</template>
