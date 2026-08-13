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
    expect(handled.get('.cw-viz-line__point-background').attributes('fill')).toBe('#ebebef')
    expect(handled.get('.cw-viz-line__point-background').attributes('stroke')).toBe('#ebebef')
    expect(handled.get('.cw-viz-line__point-background').attributes('r')).toBe('5')
    expect(handled.get('.cw-viz-line__point').attributes('r')).toBe('4')
    expect(handled.get('.cw-viz-line__point').attributes('stroke')).toBeUndefined()
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

  it('renders y-axis ticks using a functional step size', () => {
    const yStepSize = vi.fn(() => 20)
    const wrapper = mount(LineChart, { props: { data, yStepSize, yTickCount: 6 } })

    expect(yStepSize).toHaveBeenCalledWith({
      max: 51,
      min: 12,
      tickCount: 6,
      values: [30, 40, 35, 51, 12, 29, 23, 39],
    })
    expect(wrapper.findAll('.cw-viz-line__y-tick').map((tick) => tick.text())).toEqual([
      '0',
      '20',
      '40',
      '60',
    ])
  })

  it('renders a rich HTML tooltip with every series for the hovered category', async () => {
    const wrapper = mount(LineChart, { props: { data, width: 720 } })
    const resolvedPoint = wrapper
      .get('[data-series-id="resolved"]')
      .findAll('.cw-viz-line__point-group')[2]

    await resolvedPoint.trigger('pointerenter')

    const tooltip = wrapper.get('div[role="tooltip"]')
    expect(tooltip.get('.cw-viz-line__tooltip-title').text()).toBe('Jun 15 - 21')
    expect(tooltip.findAll('.cw-viz-line__tooltip-row')).toHaveLength(2)
    expect(tooltip.text()).toContain('Handled')
    expect(tooltip.text()).toContain('35')
    expect(tooltip.text()).toContain('Resolved')
    expect(tooltip.text()).toContain('23')
    expect(tooltip.findAll('svg')).toHaveLength(0)
    expect(wrapper.findAll('svg title')).toHaveLength(0)

    await resolvedPoint.trigger('pointerleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('renders descriptions from point objects only when provided', async () => {
    const wrapper = mount(LineChart, {
      props: {
        data: {
          categories: ['01-Aug', '02-Aug'],
          series: [
            {
              id: 'resolution-time',
              label: 'Resolution Time',
              data: [{ value: 747, description: 'Based on 14 conversations' }, { value: 600 }],
            },
          ],
        },
      },
    })
    const points = wrapper.findAll('.cw-viz-line__point-group')

    await points[0].trigger('pointerenter')
    expect(wrapper.get('.cw-viz-line__tooltip-description').text()).toBe(
      'Based on 14 conversations',
    )
    expect(points[0].attributes('aria-label')).toContain('Based on 14 conversations')

    await points[1].trigger('pointerenter')
    expect(wrapper.find('.cw-viz-line__tooltip-description').exists()).toBe(false)
  })

  it('can disable the tooltip', async () => {
    const wrapper = mount(LineChart, { props: { data, showTooltip: false } })
    const point = wrapper.get('.cw-viz-line__point-group')

    await point.trigger('pointerenter')

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    expect(point.attributes('tabindex')).toBeUndefined()
  })

  it('calls onItemClick with the original item and chart context', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(LineChart, {
      props: { data, onItemClick, showTooltip: false },
    })
    const point = wrapper.get('[data-series-id="resolved"]').findAll('.cw-viz-line__point-group')[2]

    expect(point.attributes('role')).toBe('button')
    expect(point.attributes('tabindex')).toBe('0')
    await point.trigger('click')

    expect(onItemClick).toHaveBeenCalledOnce()
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      category: 'Jun 15 - 21',
      categoryIndex: 2,
      categoryLabel: 'Jun 15 - 21',
      formattedValue: '23',
      item: 23,
      pointIndex: 2,
      series: data.series[1],
      seriesId: 'resolved',
      seriesIndex: 1,
      seriesLabel: 'Resolved',
      value: 23,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
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
