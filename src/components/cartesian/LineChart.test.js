import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import LineChart from './LineChart.vue'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21', 'Jun 22 - 30'],
  series: [
    {
      id: 'handled',
      label: 'Handled',
      color: '#d9d9e0',
      pointBorderColor: '#ebebef',
      pointColor: '#b9bbc6',
      valueColor: '#60646c',
      data: [30, 40, 35, 51],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      color: 'var(--resolved-color)',
      data: [12, 29, 23, 39],
    },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe('LineChart', () => {
  it('renders multiple series, points, axes, and values', () => {
    const wrapper = mount(LineChart, {
      props: {
        data,
        height: 320,
        width: 720,
        yDomain: [10, 55],
        yTicks: [15, 25, 35, 45, 55],
      },
    })

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 720 320')
    expect(wrapper.findAll('.cw-viz-line__series')).toHaveLength(2)
    expect(wrapper.findAll('.cw-viz-line__point')).toHaveLength(8)
    expect(wrapper.findAll('.cw-viz-line__y-tick')).toHaveLength(5)
    expect(wrapper.findAll('.cw-viz-line__x-tick')).toHaveLength(4)
    expect(wrapper.text()).toContain('Jun 01 - 07')
    expect(wrapper.text()).toContain('51')

    const handled = wrapper.get('[data-series-id="handled"]')
    const resolved = wrapper.get('[data-series-id="resolved"]')
    expect(handled.get('.cw-viz-line__path').attributes('stroke')).toBe('#d9d9e0')
    expect(handled.get('.cw-viz-line__point').attributes('fill')).toBe('#b9bbc6')
    expect(handled.get('.cw-viz-line__point').attributes('stroke')).toBe('#ebebef')
    expect(resolved.get('.cw-viz-line__path').attributes('stroke')).toBe('var(--resolved-color)')
    expect(
      wrapper.findAll('.cw-viz-line__path').every((line) => !line.attributes('d').includes('NaN')),
    ).toBe(true)
  })

  it('accepts object points and accessor overrides', () => {
    const wrapper = mount(LineChart, {
      props: {
        categoryLabel: (category) => category.name,
        data: {
          categories: [{ name: 'Monday' }, { name: 'Tuesday' }],
          series: [{ key: 'volume', name: 'Volume', samples: [{ total: 4 }, { total: 8 }] }],
        },
        pointValue: (point) => point.total,
        seriesColor: '#123456',
        seriesId: (series) => series.key,
        seriesLabel: (series) => series.name,
        seriesValues: (series) => series.samples,
      },
    })

    expect(wrapper.get('[data-series-id="volume"] .cw-viz-line__path').attributes('stroke')).toBe(
      '#123456',
    )
    expect(wrapper.text()).toContain('Monday')
    expect(wrapper.text()).toContain('8')
  })

  it('accepts string and function value formatters', () => {
    const percentage = mount(LineChart, { props: { data, formatValue: '%' } })

    expect(percentage.findAll('.cw-viz-line__value').some((label) => label.text() === '23%')).toBe(
      true,
    )
    expect(
      percentage.findAll('.cw-viz-line__y-tick').every((tick) => tick.text().endsWith('%')),
    ).toBe(true)

    const custom = mount(LineChart, {
      props: { data, formatValue: (value) => `${value} conversations` },
    })
    expect(
      custom.findAll('.cw-viz-line__value').some((label) => label.text() === '23 conversations'),
    ).toBe(true)
  })

  it('recalculates its inferred axis when the data range changes', async () => {
    const wrapper = mount(LineChart, { props: { data, width: 720 } })

    expect(wrapper.findAll('.cw-viz-line__y-tick').at(-1).text()).toBe('60')

    await wrapper.setProps({
      data: {
        ...data,
        series: [data.series[0], { ...data.series[1], data: [12, 29, 23, 120] }],
      },
    })

    expect(wrapper.findAll('.cw-viz-line__y-tick').at(-1).text()).toBe('120')
    expect(
      wrapper.findAll('.cw-viz-line__path').every((line) => !line.attributes('d').includes('NaN')),
    ).toBe(true)
  })

  it('breaks a line at missing points while rendering the remaining values', () => {
    const wrapper = mount(LineChart, {
      props: {
        data: {
          categories: ['One', 'Two', 'Three'],
          series: [{ id: 'series', data: [1, null, 3] }],
        },
      },
    })

    expect(wrapper.findAll('.cw-viz-line__point')).toHaveLength(2)
    expect(wrapper.get('.cw-viz-line__path').attributes('d').match(/M/g)).toHaveLength(2)
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

    const wrapper = mount(LineChart, { props: { data, width: 720 } })
    observer.callback([{ contentRect: { width: 480 } }])
    await nextTick()

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 480 360')
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('shows an empty state when no series are supplied', () => {
    const wrapper = mount(LineChart, {
      props: { data: { categories: ['One'], series: [] } },
    })

    expect(wrapper.text()).toContain('No line data to display')
    expect(wrapper.find('.cw-viz-line__axis').exists()).toBe(false)
  })
})
