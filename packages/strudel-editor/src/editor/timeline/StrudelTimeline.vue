<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Disc3,
  Footprints,
  ChartNoAxesGantt,
  Volume1,
  Volume2,
  VolumeX,
  AlignCenterVertical,
  Lock,
  ScanEye,
  LoaderCircle,
  Pause,
  Play,
  Repeat,
  Square,
  Timer
} from 'lucide-vue-next'
import IconButton from '../../components/IconButton.vue'
import { Slider } from '../../components/ui/slider'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue'
import { Select } from '../../components/ui/select'
import { Toggle } from '../../components/ui/toggle'
import {
  STRUDEL_TIMELINE_DEFAULT_VOLUME,
  STRUDEL_TIMELINE_FOLLOW_MARGIN,
  STRUDEL_TIMELINE_LOW_VOLUME,
  STRUDEL_TIMELINE_MIN_CYCLE_WIDTH,
  STRUDEL_TIMELINE_PROGRESSION_OPTIONS,
  STRUDEL_TIMELINE_SEEK_STEP
} from '../config'
import type { StrudelSourceRange, StrudelTimelineLane, StrudelTimelineProgression } from '../types'
import { useTouchSeek } from './useTouchSeek'

const props = defineProps<{
  playheadCycle: number
  timelineBars: number
  /** Each instrument's notes over the song, drawn above the playhead when the lanes are on. */
  lanes?: StrudelTimelineLane[]
  /** False until a pattern has been read, so the lanes have nothing to draw yet. */
  lanesMeasured: boolean
  /** How loud the live output is, from 0 to 1. */
  volume: number
  cyclesPerSecond: number
  /** Beats in one cycle, so the readout can say which step the playhead is on. */
  stepsPerCycle: number
  loopEnabled: boolean
  isPlaying: boolean
  /** True while the sounds load after Play, so the button shows progress instead of a dead click. */
  isLoading?: boolean
}>()

const emit = defineEmits<{
  seek: [cycle: number]
  play: []
  pause: []
  stop: []
  'update:loopEnabled': [enabled: boolean]
  'update:volume': [volume: number]
  selectNote: [ranges: StrudelSourceRange[], laneName: string]
  selectLane: [ranges: StrudelSourceRange[], laneName: string]
}>()

const trackElement = ref<HTMLElement | null>(null)
const showLanes = ref(false)

// What the mute button brings back, since muting sets the volume itself to zero.
const lastAudibleVolume = ref(STRUDEL_TIMELINE_DEFAULT_VOLUME)
const isMuted = computed(() => props.volume === 0)
const volumeIcon = computed(() => {
  if (isMuted.value) {
    return VolumeX
  }
  return props.volume < STRUDEL_TIMELINE_LOW_VOLUME ? Volume1 : Volume2
})
const volumeLabel = computed(() => (isMuted.value ? 'Sound off' : 'Sound on'))
const onVolumeMoved = (values: number[] | undefined): void => {
  const [level] = values ?? []
  if (level === undefined) {
    return
  }
  if (level > 0) {
    lastAudibleVolume.value = level
  }
  emit('update:volume', level)
}
const onMutePressed = (): void => {
  emit('update:volume', isMuted.value ? lastAudibleVolume.value : 0)
}
const progression = ref<StrudelTimelineProgression>('static')

// Only a read pattern has lanes, so turning them on before that starts the read.
watch(showLanes, (shown) => {
  if (shown && !props.lanesMeasured && !props.isPlaying && !props.isLoading) {
    emit('play')
  }
})
const progressionIcons = { static: Lock, follow: ScanEye, centered: AlignCenterVertical }
const progressionOptions = STRUDEL_TIMELINE_PROGRESSION_OPTIONS.map((option) => ({
  ...option,
  icon: progressionIcons[option.value]
}))
const onProgressionPicked = (value: string): void => {
  const picked = STRUDEL_TIMELINE_PROGRESSION_OPTIONS.find((option) => option.value === value)
  if (picked !== undefined) {
    progression.value = picked.value
  }
}
const scrollerElement = ref<HTMLElement | null>(null)
const hiddenBefore = ref(false)
const hiddenAfter = ref(false)
let resizeObserver: ResizeObserver | null = null

// The fades at either end are the clue that the song goes on past the edge.
const readHiddenEnds = (): void => {
  const scroller = scrollerElement.value
  if (scroller === null) {
    return
  }
  hiddenBefore.value = scroller.scrollLeft > 0
  hiddenAfter.value = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1
}

onMounted(() => {
  const scroller = scrollerElement.value
  if (scroller === null || typeof ResizeObserver === 'undefined') {
    return
  }
  resizeObserver = new ResizeObserver(readHiddenEnds)
  resizeObserver.observe(scroller)
})

onBeforeUnmount(() => resizeObserver?.disconnect())

watch(() => props.timelineBars, readHiddenEnds, { flush: 'post' })

// Where the playhead sits inside the scrolling content, in pixels.
const readPlayheadOffset = (track: HTMLElement): number =>
  (props.playheadCycle / props.timelineBars) * track.offsetWidth

// The scroll position the centred mode last set, so its own scroll event is not taken for a drag.
let lastCentredScroll = -1

const scrollToKeepPlayheadInView = (scroller: HTMLElement, playheadOffset: number): void => {
  const margin = STRUDEL_TIMELINE_FOLLOW_MARGIN
  const visible =
    playheadOffset >= scroller.scrollLeft + margin &&
    playheadOffset <= scroller.scrollLeft + scroller.clientWidth - margin
  if (!visible) {
    scroller.scrollLeft = playheadOffset - scroller.clientWidth / 2
  }
}

const moveTimelineWithPlayhead = (): void => {
  const scroller = scrollerElement.value
  const track = trackElement.value
  if (scroller === null || track === null || progression.value === 'static') {
    return
  }
  const playheadOffset = readPlayheadOffset(track)
  if (progression.value === 'follow') {
    scrollToKeepPlayheadInView(scroller, playheadOffset)
    return
  }
  scroller.scrollLeft = playheadOffset
  lastCentredScroll = scroller.scrollLeft
}

// Dragging the timeline under the fixed cursor moves the playhead to whatever is centred.
const seekFromCentredScroll = (): void => {
  const scroller = scrollerElement.value
  const track = trackElement.value
  if (
    progression.value !== 'centered' ||
    scroller === null ||
    track === null ||
    Math.abs(scroller.scrollLeft - lastCentredScroll) < 1
  ) {
    return
  }
  lastCentredScroll = scroller.scrollLeft
  emit('seek', (scroller.scrollLeft / track.offsetWidth) * props.timelineBars)
}

const onScrolled = (): void => {
  readHiddenEnds()
  seekFromCentredScroll()
}

watch(() => [props.playheadCycle, progression.value], moveTimelineWithPlayhead, { flush: 'post' })

const playPauseLabel = computed(() => {
  if (props.isLoading) {
    return 'Loading sounds'
  }
  return props.isPlaying ? 'Pause' : 'Play from here'
})
const loopLabel = computed(() => (props.loopEnabled ? 'Loop on' : 'Loop off'))

const onPlayPausePressed = (): void => {
  if (props.isPlaying) {
    emit('pause')
    return
  }
  emit('play')
}

const onSliderMoved = (values: number[] | undefined): void => {
  const [cycle] = values ?? []
  if (cycle !== undefined) {
    emit('seek', cycle)
  }
}

const touchSeek = useTouchSeek(
  trackElement,
  () => props.timelineBars,
  (cycle) => emit('seek', cycle)
)

// Centred mode pads the scroller by half its width on each side, so 100% of what is left is nothing.
const trackStyle = computed(() => ({
  width:
    progression.value === 'centered'
      ? `${props.timelineBars * STRUDEL_TIMELINE_MIN_CYCLE_WIDTH}px`
      : `max(100%, ${props.timelineBars * STRUDEL_TIMELINE_MIN_CYCLE_WIDTH}px)`,
  '--timeline-cycles': props.timelineBars,
  '--timeline-steps-per-cycle': props.stepsPerCycle,
  '--slider-playhead-extent': `calc(${showLanes.value ? (props.lanes?.length ?? 0) : 0} * (var(--spacing-3) + 1px))`
}))

const cycleReadout = computed(() => `${Math.floor(props.playheadCycle) + 1}/${props.timelineBars}`)
const stepReadout = computed(() => {
  const fractionOfCycle = props.playheadCycle - Math.floor(props.playheadCycle)
  return `${Math.floor(fractionOfCycle * props.stepsPerCycle) + 1}/${props.stepsPerCycle}`
})
const timeReadout = computed(() => `${(props.playheadCycle / props.cyclesPerSecond).toFixed(1)}s`)
</script>

<template>
  <section class="strudel-timeline" aria-label="Timeline">
    <div class="strudel-timeline__controls">
      <IconButton
        size="sm"
        variant="ghost"
        :title="playPauseLabel"
        :aria-label="playPauseLabel"
        :disabled="isLoading"
        :aria-busy="isLoading ? 'true' : undefined"
        @click="onPlayPausePressed"
      >
        <LoaderCircle v-if="isLoading" class="strudel-timeline__spinner" aria-hidden="true" />
        <Pause v-else-if="isPlaying" aria-hidden="true" />
        <Play v-else aria-hidden="true" />
      </IconButton>
      <IconButton
        size="sm"
        variant="ghost"
        title="Stop and rewind"
        aria-label="Stop and rewind"
        @click="emit('stop')"
      >
        <Square aria-hidden="true" />
      </IconButton>
      <Toggle
        size="sm"
        :model-value="loopEnabled"
        :title="loopLabel"
        :aria-label="loopLabel"
        @update:model-value="emit('update:loopEnabled', $event)"
      >
        <Repeat aria-hidden="true" />
      </Toggle>
      <PopoverRoot>
        <PopoverTrigger as-child>
          <IconButton size="sm" variant="ghost" :title="volumeLabel" :aria-label="volumeLabel">
            <component :is="volumeIcon" aria-hidden="true" />
          </IconButton>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent class="strudel-timeline__volume" side="top" :side-offset="4">
            <Toggle
              size="sm"
              :model-value="isMuted"
              title="Mute"
              aria-label="Mute"
              @update:model-value="onMutePressed"
            >
              <VolumeX aria-hidden="true" />
            </Toggle>
            <Slider
              :model-value="[volume]"
              :min="0"
              :max="1"
              :step="0.05"
              label="Volume"
              class="strudel-timeline__volume-slider"
              @update:model-value="onVolumeMoved"
            />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
      <Toggle
        v-model="showLanes"
        size="sm"
        title="Show instrument cycles"
        aria-label="Show instrument cycles"
      >
        <ChartNoAxesGantt aria-hidden="true" />
      </Toggle>
      <Select
        :model-value="progression"
        :options="progressionOptions"
        class="strudel-timeline__progression"
        aria-label="Timeline progression"
        @update:model-value="onProgressionPicked"
      >
        <template #icon>
          <component :is="progressionIcons[progression]" aria-hidden="true" />
        </template>
      </Select>
      <p class="strudel-timeline__readout">
        <span class="strudel-timeline__reading">
          <span title="Cycle" role="img" aria-label="Cycle"><Disc3 aria-hidden="true" /></span>
          {{ cycleReadout }}
        </span>
        <span class="strudel-timeline__reading">
          <span title="Step" role="img" aria-label="Step"><Footprints aria-hidden="true" /></span>
          {{ stepReadout }}
        </span>
        <span class="strudel-timeline__reading">
          <span title="Time" role="img" aria-label="Time"><Timer aria-hidden="true" /></span>
          {{ timeReadout }}
        </span>
      </p>
    </div>
    <div class="strudel-timeline__body">
      <div v-if="showLanes && lanes?.length" class="strudel-timeline__lane-names">
        <button
          v-for="lane in lanes"
          :key="lane.name"
          type="button"
          class="strudel-timeline__lane-name"
          :title="`Select the code of ${lane.name}`"
          :disabled="lane.sourceRanges.length === 0"
          @click="emit('selectLane', lane.sourceRanges, lane.name)"
        >
          {{ lane.name }}
        </button>
      </div>
      <div
        ref="scrollerElement"
        class="strudel-timeline__scroller"
        :class="{
          'strudel-timeline__scroller--hidden-before': hiddenBefore,
          'strudel-timeline__scroller--hidden-after': hiddenAfter,
          'strudel-timeline__scroller--centered': progression === 'centered'
        }"
        @scroll.passive="onScrolled"
      >
        <!-- The track hosts the cycle and step marks: scoped styles never reach the slider's
           radix root, so the marks cannot live on the slider itself. -->
        <div
          ref="trackElement"
          class="strudel-timeline__track"
          :class="{ 'strudel-timeline__track--ruler': showLanes }"
          :style="trackStyle"
          @pointerdown.capture="touchSeek.onPointerDown"
          @pointermove.capture="touchSeek.onPointerMove"
          @pointerup.capture="touchSeek.onPointerUp"
          @pointercancel.capture="touchSeek.onPointerCancel"
        >
          <Slider
            :model-value="[playheadCycle]"
            :min="0"
            :max="timelineBars"
            :step="STRUDEL_TIMELINE_SEEK_STEP"
            label="Playhead"
            orientation="horizontal"
            variant="playhead"
            @update:model-value="onSliderMoved"
          />
          <ol v-if="showLanes" class="strudel-timeline__ruler" aria-hidden="true">
            <li
              v-for="cycleNumber in timelineBars"
              :key="cycleNumber"
              :style="{ left: `${((cycleNumber - 1) / timelineBars) * 100}%` }"
            >
              {{ cycleNumber }}
            </li>
          </ol>
          <p v-if="showLanes && isLoading" class="strudel-timeline__lanes-loading" role="status">
            <LoaderCircle class="strudel-timeline__spinner" aria-hidden="true" />
            Reading the pattern
          </p>
          <div v-if="showLanes" class="strudel-timeline__lanes">
            <div v-for="lane in lanes" :key="lane.name" class="strudel-timeline__lane">
              <button
                v-for="(note, noteIndex) in lane.notes"
                :key="noteIndex"
                type="button"
                class="strudel-timeline__note"
                :aria-label="`${lane.name} at cycle ${note.beginCycle}`"
                :disabled="note.sourceRanges.length === 0"
                :style="{
                  left: `${(note.beginCycle / timelineBars) * 100}%`,
                  width: `${(note.durationCycles / timelineBars) * 100}%`
                }"
                @click="emit('selectNote', note.sourceRanges, lane.name)"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.strudel-timeline {
  display: grid;
  gap: var(--spacing-2);
  color: var(--color-muted-foreground);
}

.strudel-timeline__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-2);
}

.strudel-timeline__spinner {
  animation: strudel-timeline-spin 1s linear infinite;
}

@keyframes strudel-timeline-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .strudel-timeline__spinner {
    animation-duration: 3s;
  }
}

.strudel-timeline__readout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin: 0 0 0 auto;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.strudel-timeline__reading {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
}

.strudel-timeline__reading svg {
  width: 1rem;
  height: 1rem;
}

.strudel-timeline__scroller {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  padding-block: var(--spacing-1);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.strudel-timeline__scroller--hidden-before {
  mask-image: linear-gradient(to right, transparent, black var(--spacing-8));
}

.strudel-timeline__scroller--hidden-after {
  mask-image: linear-gradient(to left, transparent, black var(--spacing-8));
}

.strudel-timeline__scroller--hidden-before.strudel-timeline__scroller--hidden-after {
  mask-image: linear-gradient(
    to right,
    transparent,
    black var(--spacing-8),
    black calc(100% - var(--spacing-8)),
    transparent
  );
}

/* A new stacking context, so the marks drawn at z-index -1 sit under the slider's line and
   playhead but above whatever is behind the timeline. */
.strudel-timeline__track {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: var(--spacing-5);
}

.strudel-timeline__volume-slider {
  width: 7rem;
}

.strudel-timeline__ruler {
  position: relative;
  width: 100%;
  height: var(--spacing-3);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  line-height: var(--spacing-3);
}

.strudel-timeline__ruler li {
  position: absolute;
  padding-left: 2px;
}

/* The marks start under the numbers, so the ruler reads as a scale above the line. */
.strudel-timeline__track--ruler::before {
  top: var(--spacing-3);
}

.strudel-timeline__lanes-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  margin: 0;
  padding: var(--spacing-1) 0;
  font-size: var(--font-size-xs);
}

.strudel-timeline__lanes-loading svg {
  width: var(--font-size-base);
  height: var(--font-size-base);
}

.strudel-timeline__lanes {
  display: grid;
  width: 100%;
}

.strudel-timeline__body {
  display: flex;
  min-width: 0;
}

.strudel-timeline__scroller {
  flex: 1;
  min-width: 0;
}

/* Same top padding and row gap as the track, so each name sits level with its lane. */
.strudel-timeline__lane-names {
  display: grid;
  align-content: start;
  padding-block: calc(var(--spacing-1) + var(--spacing-3) + var(--spacing-5)) var(--spacing-1);
  max-width: 8rem;
}

.strudel-timeline__lane-name {
  box-sizing: border-box;
  height: calc(var(--spacing-3) + 1px);
  padding: 0 var(--spacing-2) 1px 0;
  overflow: hidden;
  border: 0;
  background: none;
  color: inherit;
  font-size: var(--font-size-xs);
  line-height: var(--spacing-3);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.strudel-timeline__lane-name:hover:not(:disabled) {
  color: var(--color-foreground);
}

.strudel-timeline__lane {
  position: relative;
  box-sizing: content-box;
  height: var(--spacing-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-muted);
}

.strudel-timeline__note {
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 2px;
  padding: 0;
  border: 0;
  border-radius: 1px;
  background: var(--color-primary);
  cursor: pointer;
}

.strudel-timeline__note:disabled {
  cursor: default;
}

:global(.select__trigger.strudel-timeline__progression) {
  width: auto;
  height: var(--btn-sm-height);
  gap: var(--spacing-1);
  padding: 0 var(--spacing-1);
  border-color: transparent;
  background: transparent;
  font-size: var(--font-size-xs);
}

:global(.select__trigger.strudel-timeline__progression:hover) {
  background: var(--color-accent);
}

:global(.select__trigger.strudel-timeline__progression svg) {
  width: var(--font-size-base);
  height: var(--font-size-base);
}

:global(.select__trigger.strudel-timeline__progression svg:last-child) {
  width: var(--font-size-xs);
  height: var(--font-size-xs);
}

.strudel-timeline__scroller--centered {
  padding-inline: 50%;
}

/* A taller line on every cycle and a short tick on every step, from custom properties set on
   this same element. */
.strudel-timeline__track::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 0 auto;
  height: var(--spacing-5);
  pointer-events: none;
  background-image:
    repeating-linear-gradient(
      to right,
      var(--color-muted-foreground) 0 1px,
      transparent 1px calc(100% / var(--timeline-cycles))
    ),
    repeating-linear-gradient(
      to right,
      var(--color-border) 0 1px,
      transparent 1px calc(100% / (var(--timeline-cycles) * var(--timeline-steps-per-cycle)))
    );
  background-size:
    100% 100%,
    100% 50%;
  background-position:
    0 0,
    0 50%;
  background-repeat: no-repeat;
}
</style>

<style>
.strudel-timeline__volume {
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  box-shadow: var(--shadow-lg);
}
</style>
