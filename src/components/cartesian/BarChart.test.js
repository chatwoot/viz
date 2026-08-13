import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BarChart from './BarChart.vue'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21'],
  series: [
    { id: 'handled', label: 'Handled', color: '#b9bbc6', data: [30, 40, 35] },
    { id: 'resolved', label: 'Resolved', color: '#009688', data: [12, 29, 23] },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe('BarChart', () => {
  it('renders rounded grouped bars next to one another', () => {
    const wrapper = mount(BarChart, {
      props: { data, height: 320, showValues: true, width: 720 },
    })

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 720 320')
    expect(wrapper.findAll('.cw-viz-bar__series')).toHaveLength(2)
    expect(wrapper.findAll('.cw-viz-bar__bar')).toHaveLength(6)
    expect(wrapper.findAll('.cw-viz-bar__x-tick')).toHaveLength(3)
    expect(wrapper.findAll('.cw-viz-bar__value')).toHaveLength(6)
    expect(wrapper.props('barRadius')).toBe(4)
    expect(wrapper.get('.cw-viz-bar__bar').attributes('d')).toContain('Q')

    const first = wrapper.get('[data-series-id="handled"] .cw-viz-bar__bar-group')
    const second = wrapper.get('[data-series-id="resolved"] .cw-viz-bar__bar-group')
    expect(first.attributes('transform')).not.toBe(second.attributes('transform'))
  })

  it('renders stacked bars at the same category position', () => {
    const wrapper = mount(BarChart, { props: { data, stacked: true, width: 720 } })
    const first = wrapper.get('[data-series-id="handled"] .cw-viz-bar__bar-group')
    const second = wrapper.get('[data-series-id="resolved"] .cw-viz-bar__bar-group')

    expect(first.attributes('transform').split(' ')[0]).toBe(
      second.attributes('transform').split(' ')[0],
    )
    expect(wrapper.get('desc').text()).toContain('stacked')
  })

  it('supports accessors and value formatting', () => {
    const wrapper = mount(BarChart, {
      props: {
        categoryLabel: (category) => category.name,
        data: {
          categories: [{ name: 'Monday' }],
          series: [{ key: 'volume', name: 'Volume', fill: '#123456', samples: [{ total: 8 }] }],
        },
        formatValue: '{value}%',
        pointValue: (point) => point.total,
        seriesColor: (series) => series.fill,
        seriesId: (series) => series.key,
        seriesLabel: (series) => series.name,
        seriesValues: (series) => series.samples,
        showValues: true,
      },
    })

    expect(wrapper.get('[data-series-id="volume"] .cw-viz-bar__bar').attributes('fill')).toBe(
      '#123456',
    )
    expect(wrapper.text()).toContain('Monday')
    expect(wrapper.get('.cw-viz-bar__value').text()).toBe('8%')
  })

  it('renders y-axis ticks using a fixed step size', () => {
    const wrapper = mount(BarChart, { props: { data, yStepSize: 15, yTickCount: 20 } })

    expect(wrapper.findAll('.cw-viz-bar__y-tick').map((tick) => tick.text())).toEqual([
      '0',
      '15',
      '30',
      '45',
    ])
  })

  it('renders a rich tooltip with every series for a category', async () => {
    const wrapper = mount(BarChart, { props: { data, width: 720 } })
    const resolvedBar = wrapper
      .get('[data-series-id="resolved"]')
      .findAll('.cw-viz-bar__bar-group')[1]

    await resolvedBar.trigger('pointerenter')

    const tooltip = wrapper.get('div[role="tooltip"]')
    expect(tooltip.get('.cw-viz-bar__tooltip-title').text()).toBe('Jun 08 - 14')
    expect(tooltip.findAll('.cw-viz-bar__tooltip-row')).toHaveLength(2)
    expect(tooltip.text()).toContain('Handled')
    expect(tooltip.text()).toContain('40')
    expect(tooltip.text()).toContain('Resolved')
    expect(tooltip.text()).toContain('29')

    await resolvedBar.trigger('pointerleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('calls onItemClick for pointer and keyboard activation', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(BarChart, {
      props: { data, onItemClick, showTooltip: false },
    })
    const bar = wrapper.get('[data-series-id="resolved"]').findAll('.cw-viz-bar__bar-group')[1]

    expect(bar.attributes('role')).toBe('button')
    expect(bar.attributes('tabindex')).toBe('0')
    await bar.trigger('click')
    await bar.trigger('keydown', { key: 'Enter' })

    expect(onItemClick).toHaveBeenCalledTimes(2)
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      category: 'Jun 08 - 14',
      categoryIndex: 1,
      categoryLabel: 'Jun 08 - 14',
      formattedValue: '29',
      item: 29,
      pointIndex: 1,
      series: data.series[1],
      seriesId: 'resolved',
      seriesIndex: 1,
      seriesLabel: 'Resolved',
      value: 29,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
    expect(onItemClick.mock.calls[1][0].event).toBeInstanceOf(KeyboardEvent)
  })

  it('thins dense time-series ticks without dropping the endpoints', () => {
    const categories = Array.from({ length: 40 }, (_, index) => `Day ${index + 1}`)
    const wrapper = mount(BarChart, {
      props: {
        data: {
          categories,
          series: [{ id: 'volume', data: categories.map(() => 10) }],
        },
        timeseries: true,
        width: 720,
      },
    })
    const ticks = wrapper.findAll('.cw-viz-bar__x-tick')

    expect(ticks.length).toBeLessThan(categories.length)
    expect(ticks[0].text()).toBe('Day 1')
    expect(ticks.at(-1).text()).toBe('Day 40')
  })

  it('recalculates the layout when its container resizes', async () => {
    let observer
    const disconnect = vi.fn()
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          this.callback = callback
          observer = this
        }

        observe() {}

        disconnect() {
          disconnect()
        }
      },
    )

    const wrapper = mount(BarChart, { props: { data, width: 720 } })
    observer.callback([{ contentRect: { width: 480 } }])
    await nextTick()

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 480 360')
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('shows an empty state when no series are supplied', () => {
    const wrapper = mount(BarChart, {
      props: { data: { categories: ['One'], series: [] } },
    })

    expect(wrapper.text()).toContain('No bar data to display')
    expect(wrapper.find('.cw-viz-bar__axis').exists()).toBe(false)
  })
})
