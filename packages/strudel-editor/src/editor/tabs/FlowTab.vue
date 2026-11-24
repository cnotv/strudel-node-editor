<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Plus, RotateCcw } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import ButtonSelector from '../../components/ui/button-selector/ButtonSelector.vue'
import { STRUDEL_FLOW_NODE_DEFINITIONS, STRUDEL_FLOW_REFERENCE } from '@webgamekit/strudel-flow'
import { STRUDEL_API_WORKSHOP_NAMES } from '../strudelApiGroups'
import {
  STRUDEL_API_ENTRIES,
  findStrudelApiEntry,
  groupStrudelApiEntries,
  matchesStrudelApiSearch
} from '../strudelApiCatalog'
import type {
  StrudelApiEntry,
  StrudelFlowNodeCategory,
  StrudelFlowNodeData,
  StrudelFlowNodeKind
} from '../types'

const emit = defineEmits<{
  addNode: [kind: StrudelFlowNodeKind, data?: StrudelFlowNodeData]
  reset: []
}>()

type FlowTabView = 'nodes' | 'functions'
type FunctionCopyMessage = { name: string; text: string }
type FunctionShortcut = { name: string; entry: StrudelApiEntry }

const COPY_MESSAGE_MILLISECONDS = 2000
const VIEW_OPTIONS = [
  { value: 'nodes', label: 'Nodes' },
  { value: 'functions', label: 'Functions' }
]
const NODE_CATEGORIES: StrudelFlowNodeCategory[] = ['Instruments', 'Effects', 'Sounds']

const activeView = ref<FlowTabView>('nodes')
const searchQuery = ref('')
const copyMessage = ref<FunctionCopyMessage | null>(null)

const nodeGroups = NODE_CATEGORIES.map((category) => ({
  category,
  definitions: STRUDEL_FLOW_NODE_DEFINITIONS.filter(
    (definition) => definition.category === category
  )
}))

const nodeTitleByKind = new Map(
  STRUDEL_FLOW_NODE_DEFINITIONS.map((definition) => [definition.kind, definition.title])
)

const workshopEntries: FunctionShortcut[] = STRUDEL_API_WORKSHOP_NAMES.flatMap((name) => {
  const entry = findStrudelApiEntry(name)
  return entry === null ? [] : [{ name, entry }]
})

const visibleFunctionGroups = computed(() =>
  groupStrudelApiEntries(
    STRUDEL_API_ENTRIES.filter((entry) => matchesStrudelApiSearch(entry, searchQuery.value))
  )
)

const setView = (view: string): void => {
  if (view === 'nodes' || view === 'functions') {
    activeView.value = view
  }
}

const setSearchQuery = (query: string | number): void => {
  searchQuery.value = String(query)
}

const nodeTitle = (kind: StrudelFlowNodeKind): string => nodeTitleByKind.get(kind) ?? kind

const describeAddTarget = (entry: StrudelApiEntry): string => {
  if (entry.add === null) {
    return 'No example'
  }
  return entry.add.kind === 'code' ? 'Code' : nodeTitle(entry.add.kind)
}

const describeDetails = (entry: StrudelApiEntry): string =>
  [
    entry.params.length > 0
      ? `${entry.params.length} parameter${entry.params.length === 1 ? '' : 's'}`
      : '',
    entry.examples.length > 0
      ? `${entry.examples.length} example${entry.examples.length === 1 ? '' : 's'}`
      : ''
  ]
    .filter((part) => part !== '')
    .join(' · ')

const addFunction = (entry: StrudelApiEntry): void => {
  const target = entry.add
  if (target === null) {
    return
  }
  if (target.kind === 'code') {
    emit('addNode', 'code', { kind: 'code', code: target.code })
    return
  }
  emit('addNode', target.kind)
}

const copyFunction = async (entry: StrudelApiEntry): Promise<void> => {
  try {
    await navigator.clipboard.writeText(entry.examples[0] ?? entry.name)
    copyMessage.value = { name: entry.name, text: 'Copied' }
    setTimeout(() => {
      copyMessage.value = null
    }, COPY_MESSAGE_MILLISECONDS)
  } catch {
    copyMessage.value = { name: entry.name, text: 'Copy failed' }
  }
}
</script>

<template>
  <div class="strudel-flow-tab">
    <h3 class="strudel-flow-tab__heading">flow</h3>
    <ButtonSelector
      :model-value="activeView"
      :options="VIEW_OPTIONS"
      @update:model-value="setView"
    />

    <template v-if="activeView === 'nodes'">
      <p class="strudel-flow-tab__intro">
        Add instrument, effect and sound nodes, connect an output to an input, then press Play. The
        patch writes itself into the code editor on every change, and code you type rebuilds the
        patch. Tempo and beats per cycle sit on top of the canvas.
      </p>

      <section
        v-for="group in nodeGroups"
        :key="group.category"
        class="strudel-flow-tab__group"
        :aria-labelledby="`strudel-flow-palette-${group.category}`"
      >
        <h4 :id="`strudel-flow-palette-${group.category}`" class="strudel-flow-tab__group-title">
          {{ group.category }}
        </h4>
        <ul class="strudel-flow-tab__list">
          <li
            v-for="definition in group.definitions"
            :key="definition.kind"
            class="strudel-flow-tab__item"
          >
            <div class="strudel-flow-tab__item-text">
              <p class="strudel-flow-tab__item-title">{{ definition.title }}</p>
              <p class="strudel-flow-tab__item-description">{{ definition.description }}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              :aria-label="`Add ${definition.title} node`"
              @click="emit('addNode', definition.kind)"
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </li>
        </ul>
      </section>
    </template>

    <template v-else>
      <p class="strudel-flow-tab__intro">
        Every documented Strudel function, grouped by what it does. Add uses an existing node, or a
        Code node holding the documented example.
      </p>
      <Input
        :model-value="searchQuery"
        placeholder="Search functions or synonyms..."
        aria-label="Search functions"
        @update:model-value="setSearchQuery"
      />

      <section class="strudel-flow-tab__workshop" aria-labelledby="strudel-flow-workshop">
        <h4 id="strudel-flow-workshop" class="strudel-flow-tab__group-title">Start here</h4>
        <p class="strudel-flow-tab__group-hint">
          The functions the Strudel workshop teaches first.
        </p>
        <ul class="strudel-flow-tab__workshop-list">
          <li v-for="shortcut in workshopEntries" :key="shortcut.name">
            <Button
              size="sm"
              variant="secondary"
              :aria-label="`Add ${shortcut.name} as ${describeAddTarget(shortcut.entry)}`"
              :title="shortcut.entry.description"
              @click="addFunction(shortcut.entry)"
            >
              {{ shortcut.name }}
            </Button>
          </li>
        </ul>
      </section>

      <p v-if="visibleFunctionGroups.length === 0" class="strudel-flow-tab__empty" role="status">
        No function matches "{{ searchQuery }}". Try a name, a synonym, or a word from the
        description.
      </p>

      <section
        v-for="group in visibleFunctionGroups"
        :key="group.id"
        class="strudel-flow-tab__group"
        :aria-labelledby="`strudel-flow-functions-${group.id}`"
      >
        <h4 :id="`strudel-flow-functions-${group.id}`" class="strudel-flow-tab__group-title">
          {{ group.label }}
          <span class="strudel-flow-tab__group-count">{{ group.entries.length }}</span>
        </h4>
        <p class="strudel-flow-tab__group-hint">{{ group.hint }}</p>
        <ul class="strudel-flow-tab__list">
          <li v-for="entry in group.entries" :key="entry.name" class="strudel-flow-tab__function">
            <div class="strudel-flow-tab__function-head">
              <p class="strudel-flow-tab__function-name">{{ entry.name }}</p>
              <p v-if="entry.synonyms.length > 0" class="strudel-flow-tab__function-synonyms">
                {{ entry.synonyms.join(', ') }}
              </p>
              <span
                class="strudel-flow-tab__badge"
                :class="{
                  'strudel-flow-tab__badge--code': entry.add?.kind === 'code',
                  'strudel-flow-tab__badge--none': entry.add === null
                }"
              >
                {{ describeAddTarget(entry) }}
              </span>
            </div>
            <p class="strudel-flow-tab__function-description" :title="entry.description">
              {{ entry.description }}
            </p>
            <div class="strudel-flow-tab__function-actions">
              <Button
                v-if="entry.add !== null"
                size="sm"
                variant="secondary"
                :aria-label="`Add ${entry.name} as ${describeAddTarget(entry)}`"
                @click="addFunction(entry)"
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                :aria-label="`Copy ${entry.name} example`"
                @click="copyFunction(entry)"
              >
                <Copy aria-hidden="true" />
                {{ copyMessage?.name === entry.name ? copyMessage.text : 'Copy' }}
              </Button>
            </div>
            <details
              v-if="entry.params.length > 0 || entry.examples.length > 0"
              class="strudel-flow-tab__details"
            >
              <summary class="strudel-flow-tab__details-summary">
                {{ describeDetails(entry) }}
              </summary>
              <ul v-if="entry.params.length > 0" class="strudel-flow-tab__params">
                <li v-for="param in entry.params" :key="param.name" class="strudel-flow-tab__param">
                  <code class="strudel-flow-tab__param-name">{{ param.name }}</code>
                  <span v-if="param.type" class="strudel-flow-tab__param-type">
                    {{ param.type }}
                  </span>
                  <span class="strudel-flow-tab__param-description">{{ param.description }}</span>
                </li>
              </ul>
              <pre
                v-for="example in entry.examples"
                :key="example"
                class="strudel-flow-tab__example"
              ><code>{{ example }}</code></pre>
            </details>
          </li>
        </ul>
      </section>
    </template>

    <Button class="strudel-flow-tab__reset" variant="outline" @click="emit('reset')">
      <RotateCcw aria-hidden="true" />
      Reset patch
    </Button>

    <p class="strudel-flow-tab__credit">
      The flow editor follows the nodes, controls and look of
      <a :href="STRUDEL_FLOW_REFERENCE.url" target="_blank" rel="noopener">
        {{ STRUDEL_FLOW_REFERENCE.name }}
      </a>
      by
      <a :href="STRUDEL_FLOW_REFERENCE.authorUrl" target="_blank" rel="noopener">
        {{ STRUDEL_FLOW_REFERENCE.author }}
      </a>
      who also make React Flow. Its source is on
      <a :href="STRUDEL_FLOW_REFERENCE.sourceUrl" target="_blank" rel="noopener">GitHub</a>
      under {{ STRUDEL_FLOW_REFERENCE.license }}.
    </p>
  </div>
</template>

<style scoped>
.strudel-flow-tab__credit {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
}

.strudel-flow-tab__credit a {
  color: var(--color-foreground);
}

.strudel-flow-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
}

.strudel-flow-tab__heading {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.strudel-flow-tab__intro {
  margin: 0;
  color: var(--color-muted-foreground);
}

.strudel-flow-tab__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.strudel-flow-tab__group-title {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.strudel-flow-tab__group-count {
  margin-inline-start: var(--spacing-1);
  color: var(--color-foreground);
}

.strudel-flow-tab__group-hint {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
}

.strudel-flow-tab__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.strudel-flow-tab__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.strudel-flow-tab__item-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-width: 0;
}

.strudel-flow-tab__item-title,
.strudel-flow-tab__item-description {
  margin: 0;
}

.strudel-flow-tab__item-title {
  font-weight: 600;
}

.strudel-flow-tab__item-description {
  color: var(--color-muted-foreground);
}

.strudel-flow-tab__workshop,
.strudel-flow-tab__function {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.strudel-flow-tab__workshop-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.strudel-flow-tab__function {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.strudel-flow-tab__function-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.strudel-flow-tab__function-name,
.strudel-flow-tab__function-synonyms,
.strudel-flow-tab__function-description {
  margin: 0;
}

.strudel-flow-tab__function-name {
  font-family: var(--font-mono);
  font-weight: 700;
}

.strudel-flow-tab__function-synonyms {
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
}

.strudel-flow-tab__function-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted-foreground);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.strudel-flow-tab__badge {
  margin-inline-start: auto;
  padding: 0 var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-foreground);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.strudel-flow-tab__badge--code {
  border-style: dashed;
}

.strudel-flow-tab__badge--none {
  color: var(--color-muted-foreground);
}

.strudel-flow-tab__function-actions {
  display: flex;
  gap: var(--spacing-1);
}

.strudel-flow-tab__function-actions .btn {
  gap: var(--spacing-1);
}

.strudel-flow-tab__function-actions .btn svg {
  width: var(--font-size-sm);
  height: var(--font-size-sm);
}

.strudel-flow-tab__details-summary {
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.strudel-flow-tab__params {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: var(--spacing-2) 0 0;
  padding: 0;
  list-style: none;
}

.strudel-flow-tab__param {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.strudel-flow-tab__param-name {
  font-family: var(--font-mono);
  font-weight: 600;
}

.strudel-flow-tab__param-type,
.strudel-flow-tab__param-description {
  color: var(--color-muted-foreground);
}

.strudel-flow-tab__example {
  margin: var(--spacing-2) 0 0;
  padding: var(--spacing-2);
  overflow-x: auto;
  border-radius: var(--radius-md);
  background: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  white-space: pre;
}

.strudel-flow-tab__empty {
  margin: 0;
  color: var(--color-muted-foreground);
  text-align: center;
}

.strudel-flow-tab__reset {
  align-self: flex-start;
}
</style>
