<script setup lang="ts">
import { computed, ref } from 'vue'
import { GripVertical, Save, X } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import IconButton from '../../components/IconButton.vue'
import { Input } from '../../components/ui/input'
import { STRUDEL_SONG_ORDER_STORAGE_KEY } from '../config'
import {
  movePatternAfter,
  movePatternBefore,
  readStoredPatternOrder,
  sortPatternsByStoredOrder
} from '../patternOrder'
import { writeStrudelAddress } from '../strudelAddress'
import { readStorage, writeStorage } from '../../utils/storage'
import type { StrudelExample } from '../types'

interface PatternGroup {
  id: string
  title: string
  patterns: StrudelExample[]
  deletable: boolean
  saved: boolean
  draggable: boolean
}

const props = defineProps<{
  panel: 'music' | 'sounds'
  savedPatterns: StrudelExample[]
  examples: StrudelExample[]
  songs: StrudelExample[]
  currentCode: string
}>()

const emit = defineEmits<{
  select: [patternId: string]
  delete: [patternId: string]
}>()

const route = useRoute()

const searchQuery = ref('')
const songOrder = ref<string[]>(readStoredPatternOrder(readStorage(STRUDEL_SONG_ORDER_STORAGE_KEY)))
const draggedPatternId = ref<string | null>(null)
const dropTargetPatternId = ref<string | null>(null)

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const matchesSearch = (pattern: StrudelExample, query: string): boolean =>
  query.length === 0 ||
  pattern.label.toLowerCase().includes(query) ||
  pattern.code.toLowerCase().includes(query)

const orderedSongs = computed(() => sortPatternsByStoredOrder(props.songs, songOrder.value))

const patternGroups = computed<PatternGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const groups: PatternGroup[] =
    props.panel === 'music'
      ? [
          {
            id: 'saved',
            title: 'Saved',
            patterns: props.savedPatterns,
            deletable: true,
            saved: true,
            draggable: false
          },
          {
            id: 'songs',
            title: 'Songs',
            patterns: orderedSongs.value,
            deletable: false,
            saved: false,
            draggable: true
          }
        ]
      : [
          {
            id: 'examples',
            title: 'Examples',
            patterns: props.examples,
            deletable: false,
            saved: false,
            draggable: false
          }
        ]
  return groups
    .map((group) => ({
      ...group,
      patterns: group.patterns.filter((pattern) => matchesSearch(pattern, query))
    }))
    .filter((group) => group.patterns.length > 0)
})

const storeSongOrder = (nextSongIds: string[]): void => {
  songOrder.value = nextSongIds
  writeStorage(STRUDEL_SONG_ORDER_STORAGE_KEY, JSON.stringify(nextSongIds))
}

const onDragStart = (event: DragEvent, patternId: string): void => {
  draggedPatternId.value = patternId
  if (event.dataTransfer !== null) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', patternId)
  }
}

const onDragOver = (event: DragEvent, patternId: string): void => {
  if (draggedPatternId.value === null || draggedPatternId.value === patternId) {
    return
  }
  event.preventDefault()
  if (event.dataTransfer !== null) {
    event.dataTransfer.dropEffect = 'move'
  }
  dropTargetPatternId.value = patternId
}

const onDrop = (patternId: string): void => {
  if (draggedPatternId.value !== null && draggedPatternId.value !== patternId) {
    storeSongOrder(
      movePatternBefore(
        orderedSongs.value.map((song) => song.id),
        draggedPatternId.value,
        patternId
      )
    )
  }
  onDragEnd()
}

const onDragEnd = (): void => {
  draggedPatternId.value = null
  dropTargetPatternId.value = null
}

const onPatternKeydown = (event: KeyboardEvent, patternId: string, patternIds: string[]): void => {
  if (isSearching.value || !event.altKey) {
    return
  }
  const patternIndex = patternIds.indexOf(patternId)
  const isMovingUp = event.key === 'ArrowUp'
  const isMovingDown = event.key === 'ArrowDown'
  if (patternIndex < 0 || (!isMovingUp && !isMovingDown)) {
    return
  }
  const nextPatternIds = isMovingUp
    ? movePatternBefore(patternIds, patternId, patternIds[patternIndex - 1])
    : movePatternAfter(patternIds, patternId, patternIds[patternIndex + 1])
  if (nextPatternIds === patternIds) {
    return
  }
  event.preventDefault()
  storeSongOrder(nextPatternIds)
}

// The link's own navigation sets the address; loading here as well reloads a pattern already
// in the address, which would otherwise not change. A modified or middle
// click is left to the browser, to open the pattern in a new tab.
const onPatternClick = (event: MouseEvent, patternId: string): void => {
  const opensElsewhere =
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  if (!opensElsewhere) {
    emit('select', patternId)
  }
}
</script>

<template>
  <div class="strudel-patterns">
    <Input
      :model-value="searchQuery"
      class="strudel-patterns__search"
      :placeholder="panel === 'music' ? 'Search music...' : 'Search examples...'"
      :aria-label="panel === 'music' ? 'Search music' : 'Search examples'"
      @update:model-value="searchQuery = String($event)"
    />
    <section
      v-for="group in patternGroups"
      :key="group.id"
      class="strudel-patterns__group"
      :aria-label="group.title"
    >
      <h3 class="strudel-patterns__group-title">{{ group.title }} ({{ group.patterns.length }})</h3>
      <ul class="strudel-patterns__list">
        <li
          v-for="pattern in group.patterns"
          :key="pattern.id"
          class="strudel-patterns__item"
          :class="{
            'strudel-patterns__item--draggable': group.draggable,
            'strudel-patterns__item--dragging': draggedPatternId === pattern.id,
            'strudel-patterns__item--drop-target':
              dropTargetPatternId === pattern.id && draggedPatternId !== pattern.id
          }"
          :draggable="group.draggable && !isSearching"
          @dragstart="onDragStart($event, pattern.id)"
          @dragover="onDragOver($event, pattern.id)"
          @dragleave="dropTargetPatternId = null"
          @drop.prevent="onDrop(pattern.id)"
          @dragend="onDragEnd"
        >
          <span
            v-if="group.draggable"
            class="strudel-patterns__grip"
            title="Drag to reorder"
            aria-hidden="true"
          >
            <GripVertical />
          </span>
          <Save v-if="group.saved" class="strudel-patterns__saved-icon" aria-hidden="true" />
          <RouterLink
            class="strudel-patterns__link"
            :to="{ query: writeStrudelAddress(route.query, { patternId: pattern.id }) }"
            :aria-current="pattern.code === currentCode ? 'true' : undefined"
            :aria-keyshortcuts="
              group.draggable && !isSearching ? 'Alt+ArrowUp Alt+ArrowDown' : undefined
            "
            :title="
              group.draggable && !isSearching
                ? 'Drag to reorder. Alt+Arrow keys move it.'
                : undefined
            "
            @click="onPatternClick($event, pattern.id)"
            @keydown="
              group.draggable &&
              onPatternKeydown(
                $event,
                pattern.id,
                group.patterns.map((groupPattern) => groupPattern.id)
              )
            "
          >
            {{ pattern.label }}
          </RouterLink>
          <IconButton
            v-if="group.deletable"
            size="sm"
            :title="`Delete ${pattern.label}`"
            :aria-label="`Delete ${pattern.label}`"
            @click="emit('delete', pattern.id)"
          >
            <X aria-hidden="true" />
          </IconButton>
        </li>
      </ul>
    </section>
    <p v-if="patternGroups.length === 0" class="strudel-patterns__empty">
      {{ isSearching ? 'No patterns found' : 'Nothing here yet' }}
    </p>
  </div>
</template>

<style scoped>
.strudel-patterns {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-4);
}

.strudel-patterns__search {
  height: var(--btn-sm-height);
  font-size: var(--font-size-sm);
}

.strudel-patterns__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-px);
}

.strudel-patterns__group-title {
  margin: var(--spacing-1) var(--spacing-2) 0;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
}

.strudel-patterns__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-px);
}

.strudel-patterns__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 0;
  border-radius: var(--radius-md);
}

.strudel-patterns__item--draggable {
  cursor: grab;
}

.strudel-patterns__item--dragging {
  opacity: var(--opacity-muted);
}

.strudel-patterns__item--drop-target {
  box-shadow: inset 0 var(--spacing-px) 0 var(--color-ring);
}

.strudel-patterns__grip,
.strudel-patterns__saved-icon {
  flex-shrink: 0;
  width: var(--font-size-sm);
  height: var(--font-size-sm);
  color: var(--color-muted-foreground);
}

.strudel-patterns__grip {
  margin-left: var(--spacing-1);
}

.strudel-patterns__link {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  color: var(--color-foreground);
  font-size: var(--font-size-sm);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color 0.15s;
}

.strudel-patterns__link:hover,
.strudel-patterns__link[aria-current='true'] {
  background: var(--color-secondary);
}

.strudel-patterns__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-ring);
}

.strudel-patterns__empty {
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--spacing-4);
}
</style>
