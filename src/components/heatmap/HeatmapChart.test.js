import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HeatmapChart from './HeatmapChart.vue'

const data = {
  columns: Array.from({ length: 24 }, (_, hour) => ({
    id: hour,
    label: `${String(hour).padStart(2, '0')}:00`,
  })),
  rows: [
    {
      id: '2026-08-10',
      label: 'Monday',
      description: 'Aug 10, 2026',
      data: Array.from({ length: 24 }, (_, hour) => hour),
    },
    {
      id: '2026-08-11',
      label: 'Tuesday',
      description: 'Aug 11, 2026',
      data: Array.from({ length: 24 }, (_, hour) => 23 - hour),
    },
  ],
}

describe('HeatmapChart', () => {
  it('renders every day, hour, and numeric cell', () => {
    const wrapper = mount(HeatmapChart, { props: { data } })

    expect(wrapper.findAll('.cw-viz-heatmap__row-label')).toHaveLength(2)
    expect(wrapper.findAll('.cw-viz-heatmap__column-label')).toHaveLength(24)
    expect(wrapper.findAll('.cw-viz-heatmap__column-label')[0].text()).toBe('00:00')
    expect(wrapper.findAll('.cw-viz-heatmap__column-label')[23].text()).toBe('23:00')
    expect(wrapper.findAll('button.cw-viz-heatmap__cell')).toHaveLength(48)
    expect(wrapper.text()).toContain('Monday')
    expect(wrapper.text()).toContain('Aug 10, 2026')
    expect(wrapper.get('[role="grid"]').attributes('style')).toContain(
      '--cw-viz-heatmap-column-count: 24',
    )
    expect(wrapper.get('[role="grid"]').attributes('style')).toContain(
      '--cw-viz-heatmap-grid-min-width: 888px',
    )
  })

  it('formats the rich HTML tooltip for a focused cell', async () => {
    const wrapper = mount(HeatmapChart, {
      props: { data, formatValue: '{value} conversations' },
    })
    const cell = wrapper.findAll('button.cw-viz-heatmap__cell')[5]

    await cell.trigger('focus')

    const tooltip = wrapper.get('[role="tooltip"]')
    expect(tooltip.text()).toContain('Monday')
    expect(tooltip.text()).toContain('Aug 10, 2026')
    expect(tooltip.text()).toContain('05:00')
    expect(tooltip.text()).toContain('5 conversations')
  })

  it('supports object cells, accessors, and color overrides', () => {
    const wrapper = mount(HeatmapChart, {
      props: {
        cellColor: (cell) => cell.fill,
        cellValue: (cell) => cell.total,
        columnId: (column) => column.key,
        columnLabel: (column) => column.name,
        data: {
          columns: [{ key: 'midnight', name: '12am' }],
          rows: [
            {
              key: 'mon',
              name: 'Monday',
              date: 'Aug 10',
              samples: [{ total: 8, fill: '#123456' }],
            },
          ],
        },
        rowDescription: (row) => row.date,
        rowId: (row) => row.key,
        rowLabel: (row) => row.name,
        rowValues: (row) => row.samples,
      },
    })

    expect(wrapper.get('.cw-viz-heatmap__column-label').text()).toBe('12am')
    expect(wrapper.get('.cw-viz-heatmap__row-label').text()).toContain('Monday')
    expect(wrapper.get('button.cw-viz-heatmap__cell').attributes('style')).toContain(
      'background-color: rgb(18, 52, 86)',
    )
  })

  it('can disable tooltip interaction', () => {
    const wrapper = mount(HeatmapChart, { props: { data, showTooltip: false } })

    expect(wrapper.findAll('button.cw-viz-heatmap__cell')).toHaveLength(0)
    expect(wrapper.findAll('span.cw-viz-heatmap__cell')).toHaveLength(48)
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('calls onItemClick with the original cell, row, and column context', async () => {
    const onItemClick = vi.fn()
    const column = { id: 'hour-1', label: '01:00' }
    const cell = { status: 'busy', value: 8 }
    const row = {
      data: [cell],
      description: 'Aug 10, 2026',
      id: 'monday',
      label: 'Monday',
    }
    const wrapper = mount(HeatmapChart, {
      props: {
        data: { columns: [column], rows: [row] },
        formatValue: '{value} conversations',
        onItemClick,
        showTooltip: false,
      },
    })

    await wrapper.get('button.cw-viz-heatmap__cell').trigger('click')

    expect(onItemClick).toHaveBeenCalledOnce()
    expect(onItemClick.mock.calls[0][0]).toMatchObject({
      column,
      columnId: 'hour-1',
      columnIndex: 0,
      columnLabel: '01:00',
      formattedValue: '8 conversations',
      item: cell,
      itemType: 'cell',
      row,
      rowDescription: 'Aug 10, 2026',
      rowId: 'monday',
      rowIndex: 0,
      rowLabel: 'Monday',
      value: 8,
    })
    expect(onItemClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
  })

  it('renders missing values as non-interactive empty cells', () => {
    const wrapper = mount(HeatmapChart, {
      props: {
        data: { columns: [0, 1], rows: [{ id: 'monday', data: [4, null] }] },
      },
    })

    expect(wrapper.findAll('button.cw-viz-heatmap__cell')).toHaveLength(1)
    expect(wrapper.findAll('.cw-viz-heatmap__cell--empty')).toHaveLength(1)
  })

  it('shows an empty state when rows or columns are absent', () => {
    const wrapper = mount(HeatmapChart, { props: { data: { columns: [], rows: [] } } })

    expect(wrapper.get('.cw-viz-heatmap__empty').text()).toContain('at least one column and row')
    expect(wrapper.find('[role="grid"]').exists()).toBe(false)
  })
})
