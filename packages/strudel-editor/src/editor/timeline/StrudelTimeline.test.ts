import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { Select } from '../../components/ui/select'
import { STRUDEL_TIMELINE_MIN_CYCLE_WIDTH } from '../config'
import StrudelTimeline from './StrudelTimeline.vue'

const mountTimeline = (props: Partial<InstanceType<typeof StrudelTimeline>['$props']> = {}) =>
  mount(StrudelTimeline, {
    props: {
      playheadCycle: 2.5,
      timelineBars: 8,
      cyclesPerSecond: 0.5,
      stepsPerCycle: 4,
      loopEnabled: true,
      isPlaying: false,
      lanesMeasured: true,
      volume: 0,
      ...props
    }
  })

const touchEvent = (type: string, init: { clientX: number; clientY?: number }): Event =>
  Object.assign(new Event(type, { bubbles: true }), {
    pointerId: 7,
    pointerType: 'touch',
    clientY: 10,
    ...init
  })

const mountTimelineOnWideTrack = () => {
  const wrapper = mountTimeline({ playheadCycle: 0, timelineBars: 8 })
  const track = wrapper.get('.strudel-timeline__track').element as HTMLElement
  track.getBoundingClientRect = () => new DOMRect(0, 0, 800, 20)
  return {
    wrapper,
    sliderLine: wrapper.get('.strudel-timeline__track .slider__track').element,
    playhead: wrapper.get('.strudel-timeline__track [role="slider"]').element
  }
}

describe('StrudelTimeline', () => {
  it('shows a spinner and disables Play while sounds load', () => {
    // Arrange
    const wrapper = mountTimeline({ isLoading: true })

    // Act
    const playButton = wrapper.get('[aria-label="Loading sounds"]')

    // Assert
    expect(playButton.attributes('disabled')).toBeDefined()
    expect(playButton.find('.strudel-timeline__spinner').exists()).toBe(true)
    expect(playButton.attributes('aria-busy')).toBe('true')
  })

  it('shows the Play icon, enabled, when nothing is loading', () => {
    // Arrange
    const wrapper = mountTimeline({ isLoading: false })

    // Act
    const playButton = wrapper.get('[aria-label="Play from here"]')

    // Assert
    expect(playButton.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.strudel-timeline__spinner').exists()).toBe(false)
  })

  it('asks to stop when the Stop button is pressed', async () => {
    // Arrange
    const wrapper = mountTimeline()

    // Act
    await wrapper.get('button[aria-label="Stop and rewind"]').trigger('click')

    // Assert
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('turns looping off when the loop toggle is pressed', async () => {
    // Arrange
    const wrapper = mountTimeline()

    // Act
    await wrapper.get('button[aria-label="Loop on"]').trigger('click')

    // Assert
    expect(wrapper.emitted('update:loopEnabled')).toEqual([[false]])
  })

  it('reads the cycle, step and time of the playhead', () => {
    // Act
    const readout = mountTimeline().get('.strudel-timeline__readout').text()

    // Assert
    expect(readout).toContain('3/8')
    expect(readout).toContain('3/4')
    expect(readout).toContain('5.0s')
  })

  it('names each readout icon for assistive technology', () => {
    // Act
    const iconNames = mountTimeline()
      .findAll('.strudel-timeline__reading [role="img"]')
      .map((icon) => icon.attributes('aria-label'))

    // Assert
    expect(iconNames).toEqual(['Cycle', 'Step', 'Time'])
  })

  it('lays the whole song out on one slider that ends on its last cycle', () => {
    // Act
    const sliders = mountTimeline({ timelineBars: 64 }).findAll(
      '.strudel-timeline__track [role="slider"]'
    )

    // Assert
    expect(sliders).toHaveLength(1)
    expect(sliders[0]?.attributes('aria-valuemax')).toBe('64')
  })

  it('leaves the scroll where it is while the playhead runs past the visible part', async () => {
    // Arrange
    const wrapper = mountTimeline({ playheadCycle: 0, timelineBars: 64 })
    wrapper.getComponent(Select).vm.$emit('update:modelValue', 'static')
    await nextTick()
    const scroller = wrapper.get('.strudel-timeline__scroller').element as HTMLElement
    Object.defineProperty(scroller, 'clientWidth', { value: 300 })
    Object.defineProperty(scroller, 'scrollWidth', { value: 64 * STRUDEL_TIMELINE_MIN_CYCLE_WIDTH })
    scroller.scrollLeft = 0

    // Act
    await wrapper.setProps({ playheadCycle: 60 })

    // Assert
    expect(scroller.scrollLeft).toBe(0)
  })

  it('seeks to the point a touch taps, away from the playhead', async () => {
    // Arrange
    const { wrapper, sliderLine } = mountTimelineOnWideTrack()

    // Act
    sliderLine.dispatchEvent(touchEvent('pointerdown', { clientX: 400 }))
    sliderLine.dispatchEvent(touchEvent('pointerup', { clientX: 402 }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.emitted('seek')).toEqual([[4]])
  })

  it('leaves the playhead alone when a touch swipes to scroll the timeline', async () => {
    // Arrange
    const { wrapper, sliderLine } = mountTimelineOnWideTrack()

    // Act
    sliderLine.dispatchEvent(touchEvent('pointerdown', { clientX: 400 }))
    sliderLine.dispatchEvent(touchEvent('pointermove', { clientX: 350 }))
    sliderLine.dispatchEvent(touchEvent('pointermove', { clientX: 300 }))
    sliderLine.dispatchEvent(touchEvent('pointerup', { clientX: 300 }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.emitted('seek')).toBeUndefined()
  })

  it('leaves the playhead alone when the browser takes the touch over to scroll', async () => {
    // Arrange
    const { wrapper, sliderLine } = mountTimelineOnWideTrack()

    // Act
    sliderLine.dispatchEvent(touchEvent('pointerdown', { clientX: 400 }))
    sliderLine.dispatchEvent(touchEvent('pointermove', { clientX: 390 }))
    sliderLine.dispatchEvent(touchEvent('pointercancel', { clientX: 0, clientY: 0 }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.emitted('seek')).toBeUndefined()
  })

  it('drags the playhead along with a touch that starts on it', async () => {
    // Arrange
    const { wrapper, playhead } = mountTimelineOnWideTrack()

    // Act
    playhead.dispatchEvent(touchEvent('pointerdown', { clientX: 0 }))
    playhead.dispatchEvent(touchEvent('pointermove', { clientX: 100 }))
    playhead.dispatchEvent(touchEvent('pointermove', { clientX: 200 }))
    playhead.dispatchEvent(touchEvent('pointerup', { clientX: 200 }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.emitted('seek')).toEqual([[1], [2], [2]])
  })

  it('declares the playhead slider horizontal', () => {
    // Act
    const slider = mountTimeline().get('.strudel-timeline__track [role="slider"]')

    // Assert
    expect(slider.attributes('aria-orientation')).toBe('horizontal')
  })

  it('gives a long song room for every cycle, so it scrolls rather than squeezes', () => {
    // Act
    const trackWidth = mountTimeline({ timelineBars: 64 })
      .get('.strudel-timeline__track')
      .attributes('style')

    // Assert
    expect(trackWidth).toContain(`${64 * STRUDEL_TIMELINE_MIN_CYCLE_WIDTH}px`)
  })

  it('draws a lane per instrument only once the lanes toggle is on', async () => {
    // Arrange
    const lanes = [
      {
        name: 'bd',
        sound: 'bd',
        notes: [{ beginCycle: 0, durationCycles: 0.25, sourceRanges: [{ from: 5, to: 7 }] }],
        sourceRanges: [{ from: 5, to: 7 }]
      },
      {
        name: 'hh',
        sound: 'hh',
        notes: [{ beginCycle: 1, durationCycles: 0.25, sourceRanges: [] }],
        sourceRanges: []
      }
    ]
    const wrapper = mountTimeline({ lanes })
    const beforeToggle = wrapper.findAll('.strudel-timeline__lane').length

    // Act
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Assert
    expect(beforeToggle).toBe(0)
    expect(wrapper.findAll('.strudel-timeline__lane')).toHaveLength(2)
    expect(wrapper.get('.strudel-timeline__note').attributes('style')).toContain('left: 0%')
  })

  it('selects the code of a note, and of an instrument, when they are clicked', async () => {
    // Arrange
    const lane = {
      name: 'bd',
      sound: 'bd',
      notes: [{ beginCycle: 0, durationCycles: 0.25, sourceRanges: [{ from: 5, to: 7 }] }],
      sourceRanges: [{ from: 5, to: 7 }]
    }
    const wrapper = mountTimeline({ lanes: [lane] })
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Act
    await wrapper.get('.strudel-timeline__note').trigger('click')
    await wrapper.get('.strudel-timeline__lane-name').trigger('click')

    // Assert
    expect(wrapper.emitted('selectNote')).toEqual([[[{ from: 5, to: 7 }], 'bd']])
    expect(wrapper.emitted('selectLane')).toEqual([[[{ from: 5, to: 7 }], 'bd']])
  })

  it('seeks to the centred cycle when the centred timeline is scrolled', async () => {
    // Arrange
    const wrapper = mountTimeline({ playheadCycle: 0, timelineBars: 8 })
    wrapper.getComponent(Select).vm.$emit('update:modelValue', 'centered')
    await nextTick()
    const scroller = wrapper.get('.strudel-timeline__scroller').element as HTMLElement
    Object.defineProperty(wrapper.get('.strudel-timeline__track').element, 'offsetWidth', {
      value: 800
    })
    // The track has scrolled 400px left of the scroller's edge, with no padding before it.
    ;(wrapper.get('.strudel-timeline__track').element as HTMLElement).getBoundingClientRect = () =>
      new DOMRect(-400, 0, 800, 20)
    scroller.scrollLeft = 400

    // Act
    await wrapper.get('.strudel-timeline__scroller').trigger('scroll')

    // Assert
    expect(wrapper.emitted('seek')?.at(-1)).toEqual([4])
  })

  it('centres the timeline by default, with the playhead a third of the way in', async () => {
    // Arrange
    const wrapper = mountTimeline({ playheadCycle: 0, timelineBars: 64 })
    const scroller = wrapper.get('.strudel-timeline__scroller').element as HTMLElement
    Object.defineProperty(scroller, 'clientWidth', { value: 300 })
    ;(wrapper.get('.strudel-timeline__track').element as HTMLElement).getBoundingClientRect = () =>
      new DOMRect(100 - scroller.scrollLeft, 0, 3072, 20)
    Object.defineProperty(wrapper.get('.strudel-timeline__track').element, 'offsetWidth', {
      value: 3072
    })

    // Act
    await wrapper.setProps({ playheadCycle: 10 })

    // Assert
    expect(wrapper.getComponent(Select).props('modelValue')).toBe('centered')
    expect(scroller.scrollLeft).toBe(100 + (10 / 64) * 3072 - 100)
  })

  it('starts reading the pattern when the lanes are turned on before it was read', async () => {
    // Arrange
    const wrapper = mountTimeline({ lanesMeasured: false })

    // Act
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Assert
    expect(wrapper.emitted('play')).toHaveLength(1)
  })

  it.each([
    ['the pattern was already read', { lanesMeasured: true }],
    ['it is already playing', { lanesMeasured: false, isPlaying: true }],
    ['it is already loading', { lanesMeasured: false, isLoading: true }]
  ])('does not start again when %s', async (_, props) => {
    // Arrange
    const wrapper = mountTimeline(props)

    // Act
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Assert
    expect(wrapper.emitted('play')).toBeUndefined()
  })

  it('shows a loader in place of the lanes while the pattern loads', async () => {
    // Arrange
    const wrapper = mountTimeline({ isLoading: true, lanesMeasured: true })

    // Act
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Assert
    expect(wrapper.get('[role="status"]').text()).toContain('Reading the pattern')
  })

  it('numbers every cycle above the timeline once the lanes are on', async () => {
    // Arrange
    const wrapper = mountTimeline({ timelineBars: 4 })
    const beforeToggle = wrapper.find('.strudel-timeline__ruler').exists()

    // Act
    await wrapper.get('[aria-label="Show instrument cycles"]').trigger('click')

    // Assert
    expect(beforeToggle).toBe(false)
    expect(wrapper.findAll('.strudel-timeline__ruler li').map((item) => item.text())).toEqual([
      '1',
      '2',
      '3',
      '4'
    ])
  })
})
