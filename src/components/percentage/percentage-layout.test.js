import { describe, expect, it } from 'vitest'

import { createPercentageLayout } from './percentage-layout.js'

const options = {
  data: {
    segments: [
      { id: 'assistant', label: 'Assistant', value: 40, color: '#4747c2' },
      { id: 'tasks', label: 'Tasks', value: 30, color: '#ab4aba' },
      { id: 'copilot', label: 'Copilot', value: 30, color: '#009688' },
    ],
  },
  formatPercentage: '%',
  formatValue: (value) => Number(value).toLocaleString(),
  remainderColor: '#f0f0f3',
  remainderLabel: 'Unused',
  segmentColor: (segment) => segment.color,
  segmentId: (segment, index) => segment.id ?? index,
  segmentLabel: (segment, index) => segment.label ?? `Segment ${index + 1}`,
  segmentValue: (segment) => segment.value,
}

describe('createPercentageLayout', () => {
  it('normalizes segment values against their inferred total', () => {
    const layout = createPercentageLayout(options)

    expect(layout.error).toBe('')
    expect(layout.total).toBe(100)
    expect(layout.used).toBe(100)
    expect(layout.remainder).toBe(0)
    expect(layout.segments.map((segment) => segment.percentage)).toEqual([40, 30, 30])
    expect(layout.segments.map((segment) => segment.formattedPercentage)).toEqual([
      '40%',
      '30%',
      '30%',
    ])
    expect(layout.segments.map((segment) => segment.tooltipValue)).toEqual(['40%', '30%', '30%'])
  })

  it('uses an explicit total and derives the unused remainder', () => {
    const layout = createPercentageLayout({
      ...options,
      data: {
        segments: [
          { id: 'documents', label: 'Documents', value: 100 },
          { id: 'music', label: 'Music', value: 30 },
          { id: 'apps', label: 'Apps', value: 120 },
        ],
        total: 500,
      },
      formatValue: ' GB',
    })

    expect(layout.total).toBe(500)
    expect(layout.used).toBe(250)
    expect(layout.remainder).toBe(250)
    expect(layout.segments.map((segment) => segment.percentage)).toEqual([20, 6, 24, 50])
    expect(layout.segments.map((segment) => segment.formattedValue)).toEqual([
      '100 GB',
      '30 GB',
      '120 GB',
      '250 GB',
    ])
    expect(layout.segments.map((segment) => segment.tooltipValue)).toEqual([
      '100 GB · 20%',
      '30 GB · 6%',
      '120 GB · 24%',
      '250 GB · 50%',
    ])
    expect(layout.segments.at(-1)).toMatchObject({
      datum: null,
      id: '__remainder',
      isRemainder: true,
      label: 'Unused',
      value: 250,
    })
  })

  it('renders a completely unused explicit total', () => {
    const layout = createPercentageLayout({
      ...options,
      data: { segments: [], total: 500 },
      formatValue: ' GB',
    })

    expect(layout.error).toBe('')
    expect(layout.segments).toHaveLength(1)
    expect(layout.segments[0]).toMatchObject({ isRemainder: true, percentage: 100, value: 500 })
  })

  it('supports custom accessors and percentage rounding', () => {
    const layout = createPercentageLayout({
      ...options,
      data: {
        segments: [
          { fill: '#111111', key: 'one', name: 'One', total: 1 },
          { fill: '#222222', key: 'two', name: 'Two', total: 2 },
        ],
      },
      segmentColor: (segment) => segment.fill,
      segmentId: (segment) => segment.key,
      segmentLabel: (segment) => segment.name,
      segmentValue: (segment) => segment.total,
    })

    expect(layout.segments[0]).toMatchObject({
      color: '#111111',
      formattedPercentage: '33.33%',
      id: 'one',
      label: 'One',
    })
    expect(layout.segments[0].percentage).toBeCloseTo(100 / 3)
  })

  it('retains raw counts and default descriptions for an inferred distribution', () => {
    const layout = createPercentageLayout({
      ...options,
      data: {
        segments: [
          { description: 'Based on 62 responses', label: 'Excellent', value: 62 },
          { label: 'Good', value: 27 },
          { label: 'Average', value: 19 },
          { label: 'Fair', value: 9 },
          { label: 'Poor', value: 75 },
        ],
      },
      formatPercentage: (value) => `${Number(value).toFixed(2)}%`,
    })

    expect(layout.segments.map((segment) => segment.formattedPercentage)).toEqual([
      '32.29%',
      '14.06%',
      '9.90%',
      '4.69%',
      '39.06%',
    ])
    expect(layout.segments[0]).toMatchObject({
      description: 'Based on 62 responses',
      formattedValue: '62',
      tooltipValue: '62 · 32.29%',
    })
  })

  it('skips invalid and negative values', () => {
    const layout = createPercentageLayout({
      ...options,
      data: {
        segments: [
          { id: 'valid', value: 4 },
          { id: 'negative', value: -2 },
          { id: 'invalid', value: 'not-a-number' },
        ],
      },
    })

    expect(layout.error).toBe('')
    expect(layout.segments).toHaveLength(1)
    expect(layout.segments[0]).toMatchObject({ id: 'valid', percentage: 100 })
  })

  it('reports invalid totals and values above capacity', () => {
    expect(
      createPercentageLayout({ ...options, data: { segments: [], total: 0 } }).error,
    ).toContain('positive number')
    expect(
      createPercentageLayout({
        ...options,
        data: { segments: [{ value: 101 }], total: 100 },
      }).error,
    ).toContain('cannot exceed')
    expect(createPercentageLayout({ ...options, data: { segments: [] } }).error).toContain(
      'positive segment value',
    )
    expect(
      createPercentageLayout({
        ...options,
        data: { segments: [{ value: Number.MAX_VALUE }, { value: Number.MAX_VALUE }] },
      }).error,
    ).toContain('finite number')
  })
})
