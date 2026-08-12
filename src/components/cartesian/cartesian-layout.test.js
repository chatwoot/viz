import { describe, expect, it } from 'vitest'

import { createBandScale, createCartesianLayout, createPointScale } from './cartesian-layout.js'

describe('cartesian layout', () => {
  it('creates a nice numeric domain and reusable y-axis ticks', () => {
    const layout = createCartesianLayout({
      categoryCount: 4,
      height: 360,
      values: [12, 29, 23, 39, 30, 40, 35, 51],
      width: 720,
      yTickCount: 6,
    })

    expect(layout.domain).toEqual([10, 60])
    expect(layout.yTicks.map((tick) => tick.value)).toEqual([10, 20, 30, 40, 50, 60])
    expect(layout.xPositions).toHaveLength(4)
    expect(layout.mapY(60)).toBe(layout.plot.top)
    expect(layout.mapY(10)).toBe(layout.plot.bottom)
  })

  it('supports explicit domains and ticks', () => {
    const layout = createCartesianLayout({
      categoryCount: 2,
      height: 300,
      values: [12, 51],
      width: 600,
      yDomain: [10, 55],
      yTicks: [15, 25, 35, 45, 55],
    })

    expect(layout.domain).toEqual([10, 55])
    expect(layout.yTicks.map((tick) => tick.value)).toEqual([15, 25, 35, 45, 55])
  })

  it('provides point and band positions for line and bar charts', () => {
    const pointScale = createPointScale({ count: 3, end: 100, inset: 10, start: 0 })
    const bandScale = createBandScale({
      count: 3,
      end: 100,
      paddingInner: 0.2,
      paddingOuter: 0.1,
      start: 0,
    })

    expect(pointScale.positions).toEqual([10, 50, 90])
    expect(bandScale.positions).toHaveLength(3)
    expect(bandScale.bandwidth).toBeGreaterThan(0)
    expect(bandScale.step).toBeGreaterThan(bandScale.bandwidth)
  })
})
