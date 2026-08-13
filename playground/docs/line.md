Use `LineChart` to compare one or more series across shared categories. The chart is responsive and infers its y-axis from the data.

## Vue example

```vue
<script setup>
import { LineChart } from '@chatwoot/viz'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21'],
  series: [
    {
      id: 'handled',
      label: 'Handled',
      color: '#d9d9e0',
      pointColor: '#b9bbc6',
      pointBorderColor: '#ebebef',
      data: [30, 40, 35],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      color: '#009688',
      pointBorderColor: '#ccf3ee',
      data: [12, 29, 23],
    },
  ],
}
</script>

<template>
  <LineChart :data="data" format-value="%" aria-label="Conversation trends by week" />
</template>
```

Hover or focus a point to see a rich HTML tooltip containing every series value for that category.

## Data

- `categories` controls the x-axis labels.
- `series` accepts any number of lines.
- Each series supports `id`, `label`, `color`, `pointColor`, `pointBorderColor`, `valueColor`, and `data`.
- A point can be a number or an object with a `value` or `y` field. Add an optional
  `description` to show muted supporting text in its tooltip.
- Missing or non-numeric points break the line without hiding valid values.

```json
{
  "categories": ["Jun 01 - 07", "Jun 08 - 14", "Jun 15 - 21"],
  "series": [
    {
      "id": "handled",
      "label": "Handled",
      "color": "#d9d9e0",
      "pointColor": "#b9bbc6",
      "pointBorderColor": "#ebebef",
      "data": [30, 40, 35]
    },
    {
      "id": "resolved",
      "label": "Resolved",
      "color": "#009688",
      "pointBorderColor": "#ccf3ee",
      "data": [12, 29, 23]
    }
  ]
}
```

## Formatting and scale

Pass `format-value="%"` to append a suffix or use `{value}` inside a template. A function receives the numeric value, point, and series.

```vue
<LineChart :data="data" format-value="{value}%" />

<LineChart :data="data" :format-value="(value, point, series) => `${value}%`" />
```

Formatting applies to point labels, tooltip values, and y-axis ticks.

Use `yStepSize` to set a positive interval between inferred y-axis ticks. It accepts either a number or a function receiving `{ min, max, values, tickCount }`.

```vue
<LineChart :data="data" :y-step-size="10" />

<LineChart :data="data" :y-step-size="({ max }) => (max > 1_000 ? 250 : 50)" />
```

For an inferred domain, the chart rounds the minimum down and maximum up to the resolved step. An explicit `yDomain` remains unchanged. Scale options use this precedence: `yTicks`, then `yStepSize`, then automatic ticks based on `yTickCount` (default `5`).

When every value is zero, the inferred axis uses a positive `0` to `1` fallback instead of
adding a negative range. Pass `yDomain` when a different empty-state scale is required.

## Item clicks

Pass an `onItemClick` callback, or use Vue's `@item-click` syntax. Mouse clicks, Enter, and Space all invoke it.

```vue
<script setup>
function openConversationReport({ item, category, series, value }) {
  // item, category, and series are the original objects from data.
}
</script>

<template>
  <LineChart :data="data" @item-click="openConversationReport" />
</template>
```

The callback receives `item`, `category`, `series`, `value`, `formattedValue`, their indexes and labels, and the native `event`.

## Display options

- Set `showValues` to `false` to hide labels beside the dots.
- Set `showTooltip` to `false` to disable the HTML tooltip.
- `pointDescription` maps point metadata to optional tooltip supporting text. By default it
  reads `point.description`.
- Use `pointRadius` to change the marker size.
- Use CSS variables such as `--cw-viz-line-width` and `--cw-viz-line-tooltip-background` for presentation.

<details>
<summary>Point object example</summary>

Use point objects when a point needs metadata in addition to its numeric value.

```vue
<script setup>
const data = {
  categories: ['Jun 01 - 07'],
  series: [
    {
      id: 'resolved',
      data: [{ value: 12, description: 'Based on 14 conversations' }],
    },
  ],
}
</script>
```

</details>
