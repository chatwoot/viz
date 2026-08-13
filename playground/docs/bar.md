Use `BarChart` to compare values across categories. Multiple series render next to each other by default, or as cumulative stacks when `stacked` is enabled.

## Vue example

```vue
<script setup>
import { BarChart } from '@chatwoot/viz'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21'],
  series: [
    {
      id: 'automated',
      label: 'Automated',
      color: '#009688',
      data: [38, 48, 42],
    },
    {
      id: 'team',
      label: 'Team',
      color: '#b9bbc6',
      data: [24, 31, 27],
    },
  ],
}
</script>

<template>
  <BarChart :data="data" aria-label="Conversation volume by week" />
</template>
```

## Data

- `categories` controls the x-axis labels.
- `series` accepts any number of adjacent or stacked bars.
- Each series supports `id`, `label`, `color`, `valueColor`, and `data`.
- A point can be a number or an object with a `value` or `y` field.
- Missing or non-numeric points are skipped.

```json
{
  "categories": ["Jun 01 - 07", "Jun 08 - 14", "Jun 15 - 21"],
  "series": [
    {
      "id": "automated",
      "label": "Automated",
      "color": "#009688",
      "data": [38, 48, 42]
    },
    {
      "id": "team",
      "label": "Team",
      "color": "#b9bbc6",
      "data": [24, 31, 27]
    }
  ]
}
```

## Grouped and stacked bars

Grouped bars are the default. Add `stacked` to accumulate each category while keeping positive and negative stacks separate.

```vue
<BarChart :data="data" />
<BarChart :data="data" stacked />
```

The inferred y-axis includes zero. In stacked mode, it uses the complete stack totals rather than individual segment values.

## Time-series labels

Set `timeseries` when categories represent ordered dates or time periods. The chart then adapts x-axis label density to the available width while always showing the first and last labels.

```vue
<BarChart :data="data" timeseries />
```

## Formatting and display

- `formatValue` applies to tooltips, optional bar labels, and y-axis ticks.
- Set `showValues` to display values on the bars.
- Use `barRadius`, `barGap`, and `maxBarWidth` to tune bar geometry.
- Set `showTooltip` to `false` to disable the rich HTML tooltip.

## Item clicks

Pass an `onItemClick` callback, or use Vue's `@item-click` syntax. Mouse clicks, Enter, and Space all invoke it.

```vue
<script setup>
function openConversationReport({ item, category, series, value }) {
  // item, category, and series are the original objects from data.
}
</script>

<template>
  <BarChart :data="data" @item-click="openConversationReport" />
</template>
```

The callback receives `item`, `category`, `series`, `value`, `formattedValue`, their indexes and labels, and the native `event`.

<details>
<summary>Custom data accessors</summary>

```vue
<BarChart
  :data="data"
  :category-label="(category) => category.name"
  :series-id="(series) => series.key"
  :series-label="(series) => series.name"
  :series-values="(series) => series.samples"
  :point-value="(point) => point.total"
  :series-color="(series) => series.fill"
/>
```

</details>
