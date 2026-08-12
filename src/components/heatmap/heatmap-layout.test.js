import { describe, expect, it } from 'vitest'

import { createHeatmapLayout } from './heatmap-layout.js'

const data = {
  columns: [0, 1, 2],
  rows: [
    { id: 'monday', label: 'Monday', description: 'Aug 10, 2026', data: [0, 5, 10] },
    { id: 'tuesday', label: 'Tuesday', description: 'Aug 11, 2026', data: [2, null, 8] },
  ],
}

const options = {
  cellColor: (cell) => cell?.color,
  cellValue: (cell) => (typeof cell === 'number' ? cell : cell?.value),
  columnId: (column) => column,
  columnLabel: (column) => column,
  data,
  rowDescription: (row) => row.description,
  rowId: (row) => row.id,
  rowLabel: (row) => row.label,
  rowValues: (row) => row.data,
}

describe('createHeatmapLayout', () => {
  it('normalizes cells into inferred color levels', () => {
    const layout = createHeatmapLayout(options)

    expect(layout.domain).toEqual([0, 10])
    expect(layout.rows[0].cells.map((cell) => cell.level)).toEqual([0, 2, 4])
    expect(layout.rows[1].cells.map((cell) => cell.level)).toEqual([1, undefined, 4])
    expect(layout.rows[0].cells[2].formattedValue).toBe('10')
  })

  it('supports an explicit domain, formatter, and cell color override', () => {
    const layout = createHeatmapLayout({
      ...options,
      data: {
        columns: [0],
        rows: [{ id: 'monday', data: [{ value: 25, color: 'var(--busy)' }] }],
      },
      domain: [0, 100],
      formatValue: '{value} conversations',
    })

    expect(layout.domain).toEqual([0, 100])
    expect(layout.rows[0].cells[0]).toMatchObject({
      color: 'var(--busy)',
      formattedValue: '25 conversations',
      level: 1,
      value: 25,
    })
  })

  it('reports incomplete matrix data', () => {
    expect(createHeatmapLayout({ ...options, data: { columns: [], rows: [] } }).error).toContain(
      'at least one column and row',
    )
  })
})
