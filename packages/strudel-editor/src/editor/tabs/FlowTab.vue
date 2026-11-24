<script setup lang="ts">
import { computed, ref } from 'vue'
import { ExternalLink, Plus, RotateCcw } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { STRUDEL_FLOW_REFERENCE } from '@webgamekit/strudel-flow'
import type { StrudelFlowNodeData, StrudelFlowNodeKind } from '@webgamekit/strudel-flow'
import { STRUDEL_API_START_NAMES } from '../strudelApiGroups'
import {
  STRUDEL_API_ENTRIES,
  createStrudelApiFunctionData,
  findStrudelApiEntry,
  groupStrudelApiEntries,
  matchesStrudelApiSearch
} from '../strudelApiCatalog'
import type { StrudelApiEntry } from '../types'

const emit = defineEmits<{
  addNode: [kind: StrudelFlowNodeKind, data?: StrudelFlowNodeData]
  reset: []
}>()

type FunctionShortcut = { name: string; entry: StrudelApiEntry }

const searchQuery = ref('')

const startEntries: FunctionShortcut[] = STRUDEL_API_START_NAMES.flatMap((name) => {
  const entry = findStrudelApiEntry(name)
  return entry === null ? [] : [{ name, entry }]
})

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const visibleFunctionGroups = computed(() =>
  groupStrudelApiEntries(
    STRUDEL_API_ENTRIES.filter((entry) => matchesStrudelApiSearch(entry, searchQuery.value))
  )
)

const setSearchQuery = (query: string | number): void => {
  searchQuery.value = String(query)
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
  emit('addNode', 'function', createStrudelApiFunctionData(entry))
}
</script>

<template>
  <div class="strudel-flow-tab">
    <h3 class="strudel-flow-tab__heading">functions</h3>
    <p class="strudel-flow-tab__intro">
      Every documented Strudel function, grouped by what it does. Add creates a node holding the
      call and a control for each documented argument; connect it to a pattern when the function
      transforms one.
    </p>
    <Input
      :model-value="searchQuery"
      placeholder="Search functions or synonyms..."
      aria-label="Search functions"
      @update:model-value="setSearchQuery"
    />

    <section class="strudel-flow-tab__start" aria-labelledby="strudel-flow-start">
      <h4 id="strudel-flow-start" class="strudel-flow-tab__group-title">Start here</h4>
      <p class="strudel-flow-tab__group-hint">
        The functions that make a sound on their own, and the ones that combine patterns.
      </p>
      <ul class="strudel-flow-tab__start-list">
        <li v-for="shortcut in startEntries" :key="shortcut.name">
          <Button
            size="sm"
            variant="secondary"
            :aria-label="`Add ${shortcut.name} function`"
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

    <details
      v-for="group in visibleFunctionGroups"
      :key="group.id"
      class="strudel-flow-tab__group"
      :open="isSearching"
    >
      <summary class="strudel-flow-tab__group-summary">
        <span class="strudel-flow-tab__group-title">{{ group.label }}</span>
        <span class="strudel-flow-tab__group-count">{{ group.entries.length }}</span>
      </summary>
      <p class="strudel-flow-tab__group-hint">{{ group.hint }}</p>
      <ul class="strudel-flow-tab__list">
        <li v-for="entry in group.entries" :key="entry.name" class="strudel-flow-tab__function">
          <div class="strudel-flow-tab__function-head">
            <p class="strudel-flow-tab__function-name">{{ entry.name }}</p>
            <p v-if="entry.synonyms.length > 0" class="strudel-flow-tab__function-synonyms">
              {{ entry.synonyms.join(', ') }}
            </p>
          </div>
          <p class="strudel-flow-tab__function-description" :title="entry.description">
            {{ entry.description }}
          </p>
          <div class="strudel-flow-tab__function-actions">
            <Button
              size="sm"
              variant="secondary"
              :aria-label="`Add ${entry.name} function`"
              @click="addFunction(entry)"
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
            <a
              class="strudel-flow-tab__function-docs"
              :href="entry.docsUrl"
              target="_blank"
              rel="noopener"
              :aria-label="`Read the ${entry.name} docs`"
            >
              <ExternalLink aria-hidden="true" />
              Docs
            </a>
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
    </details>

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

.strudel-flow-tab__group-summary {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  cursor: pointer;
}

.strudel-flow-tab__group-summary::marker {
  color: var(--color-muted-foreground);
}

.strudel-flow-tab__group-title {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.strudel-flow-tab__group-count {
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

.strudel-flow-tab__start,
.strudel-flow-tab__function {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.strudel-flow-tab__start-list {
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

.strudel-flow-tab__function-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.strudel-flow-tab__function-actions .btn {
  gap: var(--spacing-1);
}

.strudel-flow-tab__function-actions .btn svg,
.strudel-flow-tab__function-docs svg {
  width: var(--font-size-sm);
  height: var(--font-size-sm);
}

.strudel-flow-tab__function-docs {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
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
