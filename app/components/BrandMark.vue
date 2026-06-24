<script setup lang="ts">
withDefaults(defineProps<{ size?: number; withWordmark?: boolean }>(), {
  size: 28,
  withWordmark: true,
})
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <!-- Inline SVG reproduction of the CINEASTA logo mark (person + arc). -->
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M30 30a20 20 0 0 1 40 0h-13a7 7 0 0 0-14 0H30Z"
        fill="#176a3a"
      />
      <path
        d="M12 78a38 38 0 0 1 76 0H64a14 14 0 0 0-28 0H12Z"
        fill="#176a3a"
      />
    </svg>
    <span
      v-if="withWordmark"
      class="text-lg font-extrabold tracking-tight text-gray-900"
      >CINEASTA<span class="text-brand-600">.</span></span
    >
  </span>
</template>
