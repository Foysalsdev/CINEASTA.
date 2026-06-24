<script setup lang="ts">
// Pure-SVG multi-series line chart. No dependencies, no hydration issues.
interface Series {
  name: string
  color: string
  values: number[]
}
const props = defineProps<{ labels: string[]; series: Series[] }>()

const W = 320
const H = 140
const PAD = { top: 12, right: 8, bottom: 22, left: 8 }

const max = computed(() => {
  const all = props.series.flatMap((s) => s.values)
  return Math.max(1, ...all)
})

function x(i: number): number {
  const n = Math.max(1, props.labels.length - 1)
  return PAD.left + (i * (W - PAD.left - PAD.right)) / n
}
function y(v: number): number {
  const h = H - PAD.top - PAD.bottom
  return PAD.top + h - (Math.max(0, v) / max.value) * h
}

function path(values: number[]): string {
  if (!values.length) return ''
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
}
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img">
      <!-- baseline -->
      <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(0)" :y2="y(0)" stroke="#e5e7eb" stroke-width="1" />
      <g v-for="s in series" :key="s.name">
        <path :d="path(s.values)" fill="none" :stroke="s.color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        <circle v-for="(v, i) in s.values" :key="i" :cx="x(i)" :cy="y(v)" r="2.5" :fill="s.color" />
      </g>
      <text
        v-for="(l, i) in labels"
        :key="l"
        :x="x(i)"
        :y="H - 6"
        text-anchor="middle"
        class="fill-gray-400"
        style="font-size: 8px"
      >{{ l }}</text>
    </svg>
    <div class="mt-2 flex flex-wrap gap-3">
      <span v-for="s in series" :key="s.name" class="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <span class="h-2 w-2 rounded-full" :style="{ background: s.color }" />{{ s.name }}
      </span>
    </div>
  </div>
</template>
