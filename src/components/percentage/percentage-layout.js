import { createAggregateLayout } from '../aggregate/aggregate-layout.js'

export function createPercentageLayout(options) {
  return createAggregateLayout({
    ...options,
    chartName: 'Percentage chart',
    colorNamespace: 'percentage',
  })
}
