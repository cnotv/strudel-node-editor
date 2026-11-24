<script setup lang="ts">
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'radix-vue'
import { cn } from '../../../lib/utilities'

const props = defineProps<{
  modelValue?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  class?: string
  /** Names the thumb for assistive technology, since the thumb is what takes focus. */
  label?: string
  /** `playhead` draws a thin line with a line for a thumb, for scrubbing through time; `volume` is a slim vertical bar with a small dot, as a player's. */
  variant?: 'default' | 'playhead' | 'volume'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()
</script>

<template>
  <SliderRoot
    :model-value="modelValue"
    :default-value="defaultValue ?? [0]"
    :min="min ?? 0"
    :max="max ?? 100"
    :step="step ?? 1"
    :disabled="disabled"
    :class="
      cn(
        'slider',
        { 'slider--playhead': variant === 'playhead', 'slider--volume': variant === 'volume' },
        props.class
      )
    "
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SliderTrack class="slider__track">
      <SliderRange class="slider__range" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, index) in modelValue ?? defaultValue ?? [0]"
      :key="index"
      class="slider__thumb"
      :aria-label="label"
    />
  </SliderRoot>
</template>

<style>
.slider {
  position: relative;
  display: flex;
  width: 100%;
  touch-action: none;
  user-select: none;
  align-items: center;
}

.slider__track {
  position: relative;
  height: 0.5rem;
  width: 100%;
  flex-grow: 1;
  overflow: hidden;
  border-radius: var(--radius-full);
  background-color: var(--color-secondary);
}

.slider__range {
  position: absolute;
  height: 100%;
  background-color: var(--color-primary);
}

/* Sized close to the 0.5rem track so the thumb no longer bulges past it and
   out of the panel rows the sliders sit in. */
.slider__thumb {
  display: block;
  height: 0.875rem;
  width: 0.875rem;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary);
  background-color: var(--color-background);
  transition: colors 150ms;
}

.slider__thumb:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-ring);
}

.slider__thumb:disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* The whole row takes clicks, not only the thin line, and a touch may pan the row sideways
   unless it lands on the playhead, whose wider invisible grip keeps it for dragging. */
.slider--playhead {
  z-index: 1;
  height: var(--spacing-5);
  touch-action: pan-x;
}

.slider--playhead .slider__track {
  height: 2px;
  border-radius: 0;
}

.slider--playhead .slider__thumb {
  height: var(--spacing-5);
  width: 2px;
  border: none;
  border-radius: 0;
  background-color: var(--color-playhead);
  position: relative;
  touch-action: none;
}

/* A host may set --slider-playhead-extent so the line runs on below the row, as the timeline
   does over its instrument lanes. */
.slider--playhead .slider__thumb::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 2px;
  height: var(--slider-playhead-extent, 0);
  background: inherit;
  pointer-events: none;
}

.slider--volume {
  width: var(--spacing-3);
  height: 4.5rem;
  justify-content: center;
}

.slider--volume .slider__track {
  flex-grow: 0;
  width: 2px;
  height: 100%;
  border-radius: var(--radius-full);
  background-color: var(--color-muted-foreground);
}

.slider--volume .slider__range {
  width: 100%;
  background-color: var(--color-foreground);
}

.slider--volume .slider__thumb {
  width: var(--spacing-3);
  height: var(--spacing-3);
  border: none;
  background-color: var(--color-foreground);
}

.slider--playhead .slider__thumb::before {
  content: '';
  position: absolute;
  inset: 0 calc(var(--spacing-3) * -1);
}
</style>
