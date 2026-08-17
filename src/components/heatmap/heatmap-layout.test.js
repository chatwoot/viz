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

  it('supports a configurable number of quantization levels', () => {
    const layout = createHeatmapLayout({ ...options, levelCount: 3 })

    expect(layout.levelCount).toBe(3)
    expect(layout.rows[0].cells.map((cell) => cell.level)).toEqual([0, 1, 2])
    expect(layout.rows[1].cells.map((cell) => cell.level)).toEqual([0, undefined, 2])
  })

  it('uses interpolated quantile thresholds for color levels', () => {
    const layout = createHeatmapLayout({
      ...options,
      data: {
        columns: [0, 1, 2, 3, 4, 5, 6],
        rows: [{ id: 'monday', data: [1, 2, 3, 4, 5, 6, 100] }],
      },
      levelCount: 4,
      quantiles: [0.25, 0.5, 0.75],
    })

    expect(layout.quantiles).toEqual([0.25, 0.5, 0.75])
    expect(layout.quantileThresholds).toEqual([2.5, 4, 5.5])
    expect(layout.rows[0].cells.map((cell) => cell.level)).toEqual([0, 0, 1, 1, 2, 3, 3])
  })

  it('normalizes quantiles and clamps excess buckets to the palette', () => {
    const layout = createHeatmapLayout({
      ...options,
      levelCount: 2,
      quantiles: [0.75, -1, 0.25, 0.25, 2, Number.NaN],
    })

    expect(layout.quantiles).toEqual([0.25, 0.75])
    expect(layout.quantileThresholds).toEqual([2, 8])
    expect(layout.rows[0].cells.map((cell) => cell.level)).toEqual([0, 1, 1])
  })

  it('excludes zero from quantile thresholds when zero has a separate color', () => {
    const quantileOptions = {
      ...options,
      data: {
        columns: [0, 1, 2, 3, 4],
        rows: [{ id: 'monday', data: [0, 0, 10, 20, 30] }],
      },
      excludeZeroFromQuantiles: true,
      levelCount: 3,
      quantiles: [0.5],
    }
    const layout = createHeatmapLayout(quantileOptions)

    expect(layout.quantileThresholds).toEqual([20])
    expect(layout.rows[0].cells.map((cell) => cell.level)).toEqual([0, 0, 0, 0, 1])
  })

  it('normalizes the level count to a positive integer', () => {
    expect(createHeatmapLayout({ ...options, levelCount: 2.8 }).levelCount).toBe(2)
    expect(createHeatmapLayout({ ...options, levelCount: 0 }).levelCount).toBe(1)
  })

  it('reports incomplete matrix data', () => {
    expect(createHeatmapLayout({ ...options, data: { columns: [], rows: [] } }).error).toContain(
      'at least one column and row',
    )
  })
})
