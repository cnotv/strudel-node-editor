<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import StrudelFlowStepper from '../controls/StrudelFlowStepper.vue'
import {
  STRUDEL_FLOW_MAX_NOTE_GRID_BARS,
  STRUDEL_FLOW_NOTE_GRID_STEPS_PER_BEAT
} from '../../config'
import {
  readStrudelFlowNoteGrid,
  readStrudelFlowNoteGridPitches,
  renameStrudelFlowNoteGridPitch,
  resizeStrudelFlowNoteGrid,
  toggleStrudelFlowNoteGridStep,
  writeStrudelFlowNoteGrid
} from '../../noteGrid'
import { formatStrudelFlowMidiNote, readStrudelFlowMidiNote } from '../../noteValues'
import type { StrudelFlowNoteBar } from '../../types'

const FIRST_PITCH = 'c3'

const props = defineProps<{
  bars: StrudelFlowNoteBar[]
  beatsPerBar: number
}>()

const emit = defineEmits<{
  'update:pattern': [pattern: string]
}>()

// A pitch switched off everywhere would vanish from the notes, so the grid remembers it.
const keptPitches = ref<string[]>([])

const grid = computed(() => readStrudelFlowNoteGrid(props.bars, props.beatsPerBar))
const pitches = computed(() => {
  const all = [...new Set([...keptPitches.value, ...readStrudelFlowNoteGridPitches(grid.value)])]
  return all.sort(
    (first, second) =>
      (readStrudelFlowMidiNote(second) ?? Number.NEGATIVE_INFINITY) -
      (readStrudelFlowMidiNote(first) ?? Number.NEGATIVE_INFINITY)
  )
})
const columns = computed(() =>
  grid.value.flatMap((bar, barIndex) =>
    bar.map((step, stepIndex) => ({ barIndex, stepIndex, step }))
  )
)
const stepsPerBar = computed(() => grid.value[0]?.length ?? 0)

const write = (next: string[][][]): void => {
  emit('update:pattern', writeStrudelFlowNoteGrid(next))
}

const onStepToggle = (pitch: string, barIndex: number, stepIndex: number): void => {
  keptPitches.value = pitches.value
  write(toggleStrudelFlowNoteGridStep(grid.value, barIndex, stepIndex, pitch))
}

const onBarCountChange = (barCount: number): void => {
  const barSteps =
    stepsPerBar.value || Math.round(props.beatsPerBar * STRUDEL_FLOW_NOTE_GRID_STEPS_PER_BEAT)
  const base =
    grid.value.length > 0 ? grid.value : [Array.from({ length: barSteps }, () => [] as string[])]
  write(resizeStrudelFlowNoteGrid(base, barCount))
}

const onPitchRename = (pitch: string, event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    const renamed = event.target.value.trim().toLowerCase()
    if (readStrudelFlowMidiNote(renamed) !== null && renamed !== pitch) {
      keptPitches.value = pitches.value.map((kept) => (kept === pitch ? renamed : kept))
      write(renameStrudelFlowNoteGridPitch(grid.value, pitch, renamed))
    }
  }
}

const onPitchRemove = (pitch: string): void => {
  keptPitches.value = pitches.value.filter((kept) => kept !== pitch)
  write(grid.value.map((bar) => bar.map((step) => step.filter((playing) => playing !== pitch))))
}

const onPitchAdd = (): void => {
  const lowest = readStrudelFlowMidiNote(pitches.value.at(-1) ?? '')
  const added = lowest === null ? FIRST_PITCH : formatStrudelFlowMidiNote(lowest - 1)
  keptPitches.value = [...new Set([...pitches.value, added])]
}
</script>

<template>
  <div class="strudel-flow-arrange">
    <StrudelFlowStepper
      label="Bars"
      :model-value="grid.length"
      :min="1"
      :max="Math.max(STRUDEL_FLOW_MAX_NOTE_GRID_BARS, grid.length)"
      @update:model-value="onBarCountChange"
    />
    <div
      class="strudel-flow-arrange__grid nodrag nowheel"
      role="group"
      aria-label="Note grid"
      :style="{ '--arrange-cycles': columns.length }"
    >
      <div class="strudel-flow-arrange__row" aria-hidden="true">
        <span class="strudel-flow-arrange__label" />
        <span
          v-for="column in columns"
          :key="`${column.barIndex}-${column.stepIndex}`"
          class="strudel-flow-arrange__mark"
        >
          {{ column.stepIndex === 0 ? column.barIndex + 1 : '' }}
        </span>
      </div>
      <div v-for="pitch in pitches" :key="pitch" class="strudel-flow-arrange__row">
        <span class="strudel-flow-arrange__label">
          <input
            class="strudel-flow-arrange__part"
            type="text"
            spellcheck="false"
            :value="pitch"
            :aria-label="`Pitch ${pitch}`"
            @change="onPitchRename(pitch, $event)"
          />
          <button
            type="button"
            class="strudel-flow-arrange__remove"
            :aria-label="`Remove ${pitch}`"
            @click="onPitchRemove(pitch)"
          >
            <X aria-hidden="true" />
          </button>
        </span>
        <button
          v-for="column in columns"
          :key="`${column.barIndex}-${column.stepIndex}`"
          type="button"
          class="strudel-flow-pad__cell strudel-flow-arrange__cell"
          :class="{ 'strudel-flow-pad__cell--on': column.step.includes(pitch) }"
          :aria-pressed="column.step.includes(pitch)"
          :aria-label="`${pitch} bar ${column.barIndex + 1} step ${column.stepIndex + 1}`"
          @click="onStepToggle(pitch, column.barIndex, column.stepIndex)"
        />
      </div>
    </div>
    <button type="button" class="strudel-flow-arrange__add" @click="onPitchAdd">
      <Plus aria-hidden="true" />
      Add pitch
    </button>
  </div>
</template>
