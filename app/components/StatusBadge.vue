<script setup lang="ts">
import type { ProjectStatus } from '~/types'
import { PROJECT_STATUSES, STATUS_STYLES } from '~/utils/constants'

const props = defineProps<{ status: ProjectStatus }>()
const label = computed(
  () => PROJECT_STATUSES.find((s) => s.value === props.status)?.label ?? props.status,
)
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="STATUS_STYLES[status]"
    >{{ label }}</span
  >
</template>
