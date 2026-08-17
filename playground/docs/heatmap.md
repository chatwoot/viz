Use `HeatmapChart` to compare values across a row-and-column matrix. The default story uses client-provided day and date labels against a 24-hour axis, but neither axis has date-specific behavior.

## Vue example

```vue
<script setup>
import { HeatmapChart } from '@chatwoot/viz'

const data = {
  columns: Array.from({ length: 24 }, (_, hour) => ({
    id: `hour-${hour}`,
    label: `${String(hour).padStart(2, '0')}:00`,
  })),
  rows: [
    {
      id: '2026-08-10',
      label: 'Monday',
      description: 'Aug 10, 2026',
      data: [1, 3, 1, 1, 1, 0, 0, 0, 0, 2, 1, 4, 3, 2, 5, 5, 3, 4, 4, 5, 1, 3, 5, 4],
    },
  ],
}
</script>

<template>
  <HeatmapChart :data="data" aria-label="Hourly activity by day" />
</template>
```

The component renders `label` and `description` exactly as supplied. Date parsing, weekday calculation, timezone handling, and localization stay in the client.

## Data

- `columns` controls the bottom-axis labels and may contain strings, numbers, or objects.
- `rows` accepts any number of client-defined rows.
- Each row supports `id`, `label`, optional `description`, and `data` (or `values`).
- A cell can be a number or an object with `value` or `count`.
- A cell object can include `color` as a hex value or CSS variable override.
- Missing or non-numeric cells render as non-interactive empty cells.

```json
{
  "columns": [
    { "id": "hour-0", "label": "00:00" },
    { "id": "hour-1", "label": "01:00" },
    { "id": "hour-2", "label": "02:00" }
  ],
  "rows": [
    {
      "id": "2026-08-10",
      "label": "Monday",
      "description": "Aug 10, 2026",
      "data": [2, { "value": 8, "color": "var(--busy-hour)" }, null]
    },
    {
      "id": "2026-08-11",
      "label": "Tuesday",
      "description": "Aug 11, 2026",
      "data": [4, 6, 3]
    }
  ]
}
```

## Scale and formatting

The color domain is inferred from all numeric cells. Pass `domain` when several heatmaps must share an exact linear scale. The `colors` prop supplies the palette, and its length determines the number of levels. It defaults to five colors. `formatValue` supports the same suffix, `{value}` template, or function API as the Cartesian charts.

```vue
<HeatmapChart
  :data="data"
  :domain="[0, 100]"
  :colors="['#f8f8fa', '#bdd9fb', '#1c73dc']"
  format-value="{value}%"
/>
```

Pass percentile cut points through `quantiles` when the values are skewed and equal-width linear levels hide useful variation. Quantile coloring takes precedence over the linear `domain` scale. The component sorts all numeric cells once and uses interpolated sample quantiles. Each cut point creates a bucket boundary, so provide one more color than quantiles to give every bucket a distinct color. Invalid cut points outside `0` to `1` are ignored; the remaining values are deduplicated and sorted.

```vue
<HeatmapChart
  :data="data"
  :quantiles="[0.2, 0.4, 0.6, 0.8, 0.9, 0.99]"
  :colors="heatmapColors"
  zero-color="var(--color-surface-subtle)"
/>
```

`zeroColor` gives numeric zero an exact color without using a percentile as a proxy. Do not add `0` to `quantiles` to create a zero bucket: the zeroth quantile represents the sample minimum, which is not necessarily zero. When `zeroColor` is set, zero values are excluded from the quantile calculation so they cannot collapse the non-zero buckets. Cell-level `color` values and the `cellColor` accessor still take precedence. If the palette has fewer colors than the generated buckets, overflow buckets use its last color.

## Display options

- `cellHeight` (`32`), `cellMinWidth` (`28`), and `gap` (`4`) control matrix density.
- `rowLabelWidth` (`120`) reserves space for the client-provided row labels.
- `showTooltip="false"` disables the rich HTML tooltip. Cells remain interactive when `onItemClick` is provided.
- The matrix scrolls horizontally when its columns cannot fit the container.

```css
.cw-viz-heatmap {
  --cw-viz-heatmap-level-0-color: #f8f8fa;
  --cw-viz-heatmap-level-1-color: #e2efff;
  --cw-viz-heatmap-level-2-color: #bdd9fb;
  --cw-viz-heatmap-level-3-color: #8ab6f0;
  --cw-viz-heatmap-level-4-color: #1c73dc;
}
```

The default palette uses these custom properties. Passing `colors` overrides the palette for that chart; raw CSS colors and `var(--token)` values are supported. Cell-level colors still take precedence.

## Item clicks

Pass an `onItemClick` callback, or use Vue's `@item-click` syntax. Numeric cells become native buttons, so mouse clicks, Enter, and Space all invoke the callback. Missing cells remain non-interactive.

```vue
<script setup>
function openHourlyReport({ item, row, column, value }) {
  // item, row, and column are the original values from data.
}
</script>

<template>
  <HeatmapChart :data="data" @item-click="openHourlyReport" />
</template>
```

The callback receives `itemType`, `item`, `row`, `column`, `value`, `formattedValue`, row and column ids, labels, and indexes, plus the native `event`.

<details>
<summary>Custom data accessors</summary>

```vue
<HeatmapChart
  :data="data"
  :column-id="(column) => column.key"
  :column-label="(column) => column.name"
  :row-id="(row) => row.key"
  :row-label="(row) => row.title"
  :row-description="(row) => row.subtitle"
  :row-values="(row) => row.samples"
  :cell-value="(cell) => cell.total"
  :cell-color="(cell) => cell.fill"
/>
```

</details>
