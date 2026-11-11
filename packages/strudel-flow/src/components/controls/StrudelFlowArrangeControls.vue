<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { STRUDEL_FLOW_MAX_ARRANGE_CYCLES } from '../../config'
import type { StrudelFlowArrangeData, StrudelFlowArrangeSection } from '../../types'

const props = defineProps<{
  data: StrudelFlowArrangeData
}>()

const emit = defineEmits<{
  update: [data: StrudelFlowArrangeData]
}>()

const totalCycles = computed(() =>
  props.data.sections.reduce((total, section) => total + section.cycles, 0)
)

const isSilent = (section: StrudelFlowArrangeSection): boolean =>
  ['silence', '~', ''].includes(section.pattern.trim())

const setSections = (sections: StrudelFlowArrangeSection[]): void => {
  emit('update', { ...props.data, sections })
}

const changeSection = (index: number, change: Partial<StrudelFlowArrangeSection>): void => {
  setSections(
    props.data.sections.map((section, position) =>
      position === index ? { ...section, ...change } : section
    )
  )
}

const onCyclesInput = (index: number, event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    const cycles = Math.round(Number(event.target.value))
    if (Number.isFinite(cycles) && cycles >= 1) {
      changeSection(index, { cycles: Math.min(cycles, STRUDEL_FLOW_MAX_ARRANGE_CYCLES) })
    }
  }
}

const onPatternInput = (index: number, event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    changeSection(index, { pattern: event.target.value })
  }
}

const onSectionRemove = (index: number): void => {
  setSections(props.data.sections.filter((_, position) => position !== index))
}

const onSectionAdd = (): void => {
  setSections([...props.data.sections, { cycles: 4, pattern: 'silence' }])
}
</script>

<template>
  <div class="strudel-flow-field">
    <span class="strudel-flow-field__label">Timeline, {{ totalCycles }} cycles</span>
    <ol class="strudel-flow-arrange__timeline" aria-label="Arrangement timeline">
      <li
        v-for="(section, index) in data.sections"
        :key="index"
        class="strudel-flow-arrange__segment"
        :class="{ 'strudel-flow-arrange__segment--silent': isSilent(section) }"
        :style="{ flexGrow: section.cycles }"
        :title="`${section.cycles} cycles: ${section.pattern}`"
      >
        {{ isSilent(section) ? '' : section.pattern }}
      </li>
    </ol>
  </div>
  <ul class="strudel-flow-arrange__sections" aria-label="Arrangement sections">
    <li v-for="(section, index) in data.sections" :key="index" class="strudel-flow-arrange__row">
      <input
        class="strudel-flow-arrange__cycles nodrag"
        type="number"
        min="1"
        :max="STRUDEL_FLOW_MAX_ARRANGE_CYCLES"
        :value="section.cycles"
        :aria-label="`Cycles of section ${index + 1}`"
        @input="onCyclesInput(index, $event)"
      />
      <input
        class="strudel-flow-arrange__pattern nodrag"
        type="text"
        spellcheck="false"
        :value="section.pattern"
        :aria-label="`Pattern of section ${index + 1}`"
        @input="onPatternInput(index, $event)"
      />
      <button
        type="button"
        class="strudel-flow-arrange__remove nodrag"
        :aria-label="`Remove section ${index + 1}`"
        :disabled="data.sections.length <= 1"
        @click="onSectionRemove(index)"
      >
        <X aria-hidden="true" />
      </button>
    </li>
  </ul>
  <button type="button" class="strudel-flow-arrange__add nodrag" @click="onSectionAdd">
    <Plus aria-hidden="true" />
    Add section
  </button>
</template>
