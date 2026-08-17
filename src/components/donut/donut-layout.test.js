import { describe, expect, it } from 'vitest'

import { createDonutLayout } from './donut-layout.js'

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

describe('createDonutLayout', () => {
  it('adds donut geometry to normalized aggregate segments', () => {
    const layout = createDonutLayout(options)

    expect(layout).toMatchObject({
      center: 100,
      diameter: 200,
      radius: 88,
      remainder: 0,
      thickness: 24,
      total: 100,
      used: 100,
    })
    expect(layout.segments.map((segment) => segment.percentage)).toEqual([40, 30, 30])
    expect(layout.segments.every((segment) => segment.shape === 'path')).toBe(true)
    expect(layout.segments.every((segment) => segment.path.includes('A 98 98'))).toBe(true)
    expect(
      layout.segments.every(
        (segment) => Number.isFinite(segment.tooltipX) && Number.isFinite(segment.tooltipY),
      ),
    ).toBe(true)
  })

  it('uses a continuous annular path when only one positive segment is visible', () => {
    const layout = createDonutLayout({
      ...options,
      data: { segments: [{ id: 'complete', label: 'Complete', value: 1 }] },
    })

    expect(layout.segments[0]).toMatchObject({
      percentage: 100,
      shape: 'path',
    })
    expect(layout.segments[0].path.match(/A 98 98/g)).toHaveLength(2)
  })

  it('keeps segment gaps the same width across the donut thickness', () => {
    const layout = createDonutLayout(options)
    const firstSegment = layout.segments[0]
    const boundaryAngle = -90 + (firstSegment.percentage / 100) * 360
    const outerCut =
      layout.outerRadius *
      Math.sin(((boundaryAngle - firstSegment.geometry.outerEndAngle) * Math.PI) / 180)
    const innerCut =
      layout.innerRadius *
      Math.sin(((boundaryAngle - firstSegment.geometry.innerEndAngle) * Math.PI) / 180)

    expect(outerCut).toBeCloseTo(innerCut, 5)
    expect(2 * (outerCut - layout.cornerRadius)).toBeCloseTo(layout.segmentGap, 5)
  })

  it('derives unused capacity with the same aggregate calculations', () => {
    const layout = createDonutLayout({
      ...options,
      data: {
        segments: [{ id: 'documents', label: 'Documents', value: 100 }],
        total: 500,
      },
      formatValue: ' GB',
    })

    expect(layout.segments.map((segment) => segment.percentage)).toEqual([20, 80])
    expect(layout.segments.at(-1)).toMatchObject({
      formattedValue: '400 GB',
      id: '__remainder',
      isRemainder: true,
      shape: 'path',
      tooltipValue: '400 GB · 80%',
    })
  })

  it('clamps invalid geometry and reports donut-specific data errors', () => {
    const layout = createDonutLayout({
      ...options,
      data: { segments: [{ value: 101 }], total: 100 },
      diameter: -1,
      segmentGap: 200,
      thickness: 500,
    })

    expect(layout).toMatchObject({
      cornerRadius: 2,
      diameter: 200,
      segmentGap: 200,
      thickness: 100,
    })
    expect(layout.error).toContain('Donut chart segment values cannot exceed the total')
  })
})
