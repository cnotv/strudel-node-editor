<script setup lang="ts">
import { computed } from 'vue'
import { useNodeId, useVueFlow } from '@vue-flow/core'
import {
  orderStrudelFlowArrangeParts,
  resizeStrudelFlowArrange,
  STRUDEL_FLOW_ARRANGE_SILENT,
  toggleStrudelFlowArrangeCycle
} from '../../arrangeGrid'
import { STRUDEL_FLOW_MAX_ARRANGE_CYCLES } from '../../config'
import { getStrudelFlowNodeDefinition } from '../../nodeDefinitions'
import type { StrudelFlowArrangeData, StrudelFlowNode } from '../../types'
import StrudelFlowStepper from './StrudelFlowStepper.vue'

const CYCLES_PER_RULER_MARK = 4

const props = defineProps<{
  data: StrudelFlowArrangeData
}>()

const emit = defineEmits<{
  update: [data: StrudelFlowArrangeData]
}>()

const nodeId = useNodeId()
const { getEdges, getNodes } = useVueFlow()

// A part is a node cabled into this one; they sit in rows from top to bottom, as on the canvas.
const parts = computed(() => {
  const sourceIds = new Set(
    getEdges.value.filter((edge) => edge.target === nodeId).map((edge) => edge.source)
  )
  return orderStrudelFlowArrangeParts(
    getNodes.value.filter((node): node is StrudelFlowNode => sourceIds.has(node.id))
  ).map((node, index) => ({
    label: `${index + 1}. ${getStrudelFlowNodeDefinition(node.data.kind).title}`
  }))
})

const onCycleToggle = (part: number, cycle: number): void => {
  emit('update', {
    ...props.data,
    sequence: toggleStrudelFlowArrangeCycle(props.data.sequence, part, cycle)
  })
}

const onLengthChange = (length: number): void => {
  emit('update', { ...props.data, sequence: resizeStrudelFlowArrange(props.data.sequence, length) })
}
</script>

<template>
  <div class="strudel-flow-arrange">
    <StrudelFlowStepper
      label="Cycles"
      :model-value="data.sequence.length"
      :min="1"
      :max="Math.max(STRUDEL_FLOW_MAX_ARRANGE_CYCLES, data.sequence.length)"
      @update:model-value="onLengthChange"
    />
    <p v-if="parts.length === 0" class="strudel-flow-arrange__empty">
      Cable the nodes that make each part into this one.
    </p>
    <div
      v-else
      class="strudel-flow-arrange__grid nodrag nowheel"
      role="group"
      aria-label="Arrangement"
      :style="{ '--arrange-cycles': data.sequence.length }"
    >
      <div class="strudel-flow-arrange__row" aria-hidden="true">
        <span class="strudel-flow-arrange__label" />
        <span
          v-for="(_, cycleIndex) in data.sequence"
          :key="cycleIndex"
          class="strudel-flow-arrange__mark"
        >
          {{ cycleIndex % CYCLES_PER_RULER_MARK === 0 ? cycleIndex + 1 : '' }}
        </span>
      </div>
      <div v-for="(part, partIndex) in parts" :key="partIndex" class="strudel-flow-arrange__row">
        <span class="strudel-flow-arrange__label">{{ part.label }}</span>
        <button
          v-for="(playing, cycleIndex) in data.sequence"
          :key="cycleIndex"
          type="button"
          class="strudel-flow-pad__cell strudel-flow-arrange__cell"
          :class="{ 'strudel-flow-pad__cell--on': playing === partIndex }"
          :aria-pressed="playing === partIndex"
          :aria-label="`${part.label} cycle ${cycleIndex + 1}`"
          @click="onCycleToggle(partIndex, cycleIndex)"
        />
      </div>
    </div>
  </div>
</template>
