import { describe, expect, it } from 'vitest'

import { createBarLayout } from './bar-layout.js'

const accessors = {
  categoryLabel: (category) => category,
  formatValue: (value) => String(value),
  pointValue: (point) => point,
  seriesColor: (series) => series.color,
  seriesId: (series) => series.id,
  seriesLabel: (series) => series.label,
  seriesValueColor: (series) => series.valueColor,
  seriesValues: (series) => series.data,
}

const data = {
  categories: ['One', 'Two'],
  series: [
    { id: 'first', label: 'First', color: '#111111', data: [10, 20] },
    { id: 'second', label: 'Second', color: '#222222', data: [5, 15] },
  ],
}

function layout(options = {}) {
  return createBarLayout({
    ...accessors,
    barGap: 6,
    barRadius: 6,
    data,
    height: 320,
    maxBarWidth: 48,
    stacked: false,
    width: 640,
    yTickCount: 5,
    ...options,
  })
}

describe('bar layout', () => {
  it('places multiple series next to one another inside each category', () => {
    const result = layout()
    const first = result.series[0].points[0]
    const second = result.series[1].points[0]

    expect(first.centerX).toBeLessThan(second.centerX)
    expect(first.width).toBeLessThanOrEqual(48)
    expect(first.path).toContain('Q')
    expect(result.domain[0]).toBe(0)
    expect(result.categories).toHaveLength(2)
  })

  it('stacks positive values and uses their totals for the y-domain', () => {
    const result = layout({ stacked: true })
    const first = result.series[0].points[0]
    const second = result.series[1].points[0]

    expect(first.centerX).toBe(second.centerX)
    expect(first.startValue).toBe(0)
    expect(first.endValue).toBe(10)
    expect(second.startValue).toBe(10)
    expect(second.endValue).toBe(15)
    expect(result.domain[1]).toBeGreaterThanOrEqual(35)
  })

  it('stacks negative values below zero independently from positive values', () => {
    const result = layout({
      data: {
        categories: ['One'],
        series: [
          { id: 'positive', label: 'Positive', data: [8] },
          { id: 'negative-a', label: 'Negative A', data: [-3] },
          { id: 'negative-b', label: 'Negative B', data: [-4] },
        ],
      },
      stacked: true,
    })

    expect(result.series[0].points[0].startValue).toBe(0)
    expect(result.series[1].points[0].startValue).toBe(0)
    expect(result.series[2].points[0].startValue).toBe(-3)
    expect(result.series[2].points[0].endValue).toBe(-7)
    expect(result.domain[0]).toBeLessThanOrEqual(-7)
    expect(result.zeroY).toBeLessThan(result.plot.bottom)
  })

  it('thins dense time-series labels while preserving the first and last labels', () => {
    const categories = Array.from({ length: 40 }, (_, index) => `Day ${index + 1}`)
    const result = layout({
      data: {
        categories,
        series: [{ id: 'volume', label: 'Volume', data: categories.map(() => 10) }],
      },
      timeseries: true,
    })
    const visibleLabels = result.categories.filter((category) => category.showLabel)

    expect(visibleLabels.length).toBeLessThan(categories.length)
    expect(visibleLabels[0].label).toBe('Day 1')
    expect(visibleLabels.at(-1).label).toBe('Day 40')
  })
})
