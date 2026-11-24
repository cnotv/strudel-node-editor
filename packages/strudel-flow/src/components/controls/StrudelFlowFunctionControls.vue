<script setup lang="ts">
import StrudelFlowKnob from './StrudelFlowKnob.vue'
import type { StrudelFlowFunctionData, StrudelFlowFunctionParameter } from '../../types'

type NumberParameter = Extract<StrudelFlowFunctionParameter, { kind: 'number' }>
type BooleanParameter = Extract<StrudelFlowFunctionParameter, { kind: 'boolean' }>
type TextParameter = Extract<StrudelFlowFunctionParameter, { kind: 'text' }>

const props = defineProps<{
  data: StrudelFlowFunctionData
}>()

const emit = defineEmits<{
  update: [data: StrudelFlowFunctionData]
}>()

const updateParameter = (index: number, parameter: StrudelFlowFunctionParameter): void => {
  emit('update', {
    ...props.data,
    parameters: props.data.parameters.map((current, currentIndex) =>
      currentIndex === index ? parameter : current
    )
  })
}

const updateNumber = (index: number, parameter: NumberParameter, value: number): void => {
  updateParameter(index, { ...parameter, value })
}

const updateBoolean = (index: number, parameter: BooleanParameter): void => {
  updateParameter(index, { ...parameter, value: !parameter.value })
}

const updateText = (index: number, parameter: TextParameter, event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    updateParameter(index, { ...parameter, value: event.target.value })
  }
}
</script>

<template>
  <div class="strudel-flow-function">
    <p v-if="data.parameters.length === 0" class="strudel-flow-function__empty">
      No documented arguments.
    </p>
    <div v-else class="strudel-flow-function__parameters">
      <template v-for="(parameter, index) in data.parameters" :key="`${parameter.name}-${index}`">
        <StrudelFlowKnob
          v-if="parameter.kind === 'number'"
          :label="parameter.label"
          :model-value="parameter.value"
          :min="parameter.min"
          :max="parameter.max"
          :step="parameter.step"
          @update:model-value="updateNumber(index, parameter, $event)"
        />
        <div
          v-else-if="parameter.kind === 'boolean'"
          class="strudel-flow-field strudel-flow-field--inline"
        >
          <span class="strudel-flow-field__label">{{ parameter.label }}</span>
          <button
            type="button"
            role="switch"
            class="strudel-flow-switch nodrag"
            :aria-checked="parameter.value"
            :aria-label="parameter.label"
            @click="updateBoolean(index, parameter)"
          >
            <span class="strudel-flow-switch__thumb" aria-hidden="true" />
          </button>
        </div>
        <label v-else class="strudel-flow-field">
          <span class="strudel-flow-field__label">{{ parameter.label }}</span>
          <input
            class="input nodrag"
            :value="parameter.value"
            :aria-label="parameter.label"
            spellcheck="false"
            @input="updateText(index, parameter, $event)"
          />
        </label>
      </template>
    </div>
    <a
      class="strudel-flow-function__docs"
      :href="data.docsUrl"
      target="_blank"
      rel="noopener"
      :title="data.description"
    >
      Docs
    </a>
  </div>
</template>
