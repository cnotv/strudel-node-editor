<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import {
  expandStrudelFlowArrange,
  readStrudelFlowArrangeRows,
  renameStrudelFlowArrangeRow,
  resizeStrudelFlowArrange,
  toggleStrudelFlowArrangeCycle
} from '../../arrangeGrid'
import { STRUDEL_FLOW_MAX_ARRANGE_CYCLES } from '../../config'
import type { StrudelFlowArrangeData, StrudelFlowArrangeSection } from '../../types'
import StrudelFlowStepper from './StrudelFlowStepper.vue'

const NEW_PART = 's("bd*4")'
const CYCLES_PER_RULER_MARK = 4

const props = defineProps<{
  data: StrudelFlowArrangeData
}>()

const emit = defineEmits<{
  update: [data: StrudelFlowArrangeData]
}>()

// A part switched off everywhere would vanish from the sections, so the grid remembers it.
const keptParts = ref<string[]>([])

const cycles = computed(() => expandStrudelFlowArrange(props.data.sections))
const parts = computed(() => [
  ...new Set([...keptParts.value, ...readStrudelFlowArrangeRows(props.data.sections)])
])

const setSections = (sections: StrudelFlowArrangeSection[]): void => {
  emit('update', { ...props.data, sections })
}

const onCycleToggle = (part: string, cycle: number): void => {
  keptParts.value = parts.value
  setSections(toggleStrudelFlowArrangeCycle(props.data.sections, part, cycle))
}

const onLengthChange = (length: number): void => {
  setSections(resizeStrudelFlowArrange(props.data.sections, length))
}

const onPartRename = (part: string, event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    const renamed = event.target.value.trim()
    if (renamed.length > 0 && renamed !== part) {
      keptParts.value = parts.value.map((kept) => (kept === part ? renamed : kept))
      setSections(renameStrudelFlowArrangeRow(props.data.sections, part, renamed))
    }
  }
}

const onPartRemove = (part: string): void => {
  keptParts.value = parts.value.filter((kept) => kept !== part)
  setSections(renameStrudelFlowArrangeRow(props.data.sections, part, 'silence'))
}

const onPartAdd = (): void => {
  keptParts.value = [...new Set([...parts.value, NEW_PART])]
}
</script>

<template>
  <div class="strudel-flow-arrange">
    <StrudelFlowStepper
      label="Cycles"
      :model-value="cycles.length"
      :min="1"
      :max="Math.max(STRUDEL_FLOW_MAX_ARRANGE_CYCLES, cycles.length)"
      @update:model-value="onLengthChange"
    />
    <div
      class="strudel-flow-arrange__grid nodrag nowheel"
      role="group"
      aria-label="Arrangement"
      :style="{ '--arrange-cycles': cycles.length }"
    >
      <div class="strudel-flow-arrange__row" aria-hidden="true">
        <span class="strudel-flow-arrange__label" />
        <span
          v-for="(_, cycleIndex) in cycles"
          :key="cycleIndex"
          class="strudel-flow-arrange__mark"
        >
          {{ cycleIndex % CYCLES_PER_RULER_MARK === 0 ? cycleIndex + 1 : '' }}
        </span>
      </div>
      <div v-for="part in parts" :key="part" class="strudel-flow-arrange__row">
        <span class="strudel-flow-arrange__label">
          <input
            class="strudel-flow-arrange__part"
            type="text"
            spellcheck="false"
            :value="part"
            :title="part"
            :aria-label="`Part ${part}`"
            @change="onPartRename(part, $event)"
          />
          <button
            type="button"
            class="strudel-flow-arrange__remove"
            :aria-label="`Remove ${part}`"
            @click="onPartRemove(part)"
          >
            <X aria-hidden="true" />
          </button>
        </span>
        <button
          v-for="(playing, cycleIndex) in cycles"
          :key="cycleIndex"
          type="button"
          class="strudel-flow-pad__cell strudel-flow-arrange__cell"
          :class="{ 'strudel-flow-pad__cell--on': playing === part }"
          :aria-pressed="playing === part"
          :aria-label="`${part} cycle ${cycleIndex + 1}`"
          :title="`${part} cycle ${cycleIndex + 1}`"
          @click="onCycleToggle(part, cycleIndex)"
        />
      </div>
    </div>
    <button type="button" class="strudel-flow-arrange__add" @click="onPartAdd">
      <Plus aria-hidden="true" />
      Add part
    </button>
  </div>
</template>
