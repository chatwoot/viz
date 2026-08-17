---
name: chatwoot-viz
description: >
  Build and modify Vue 3 data visualizations with @chatwoot/viz. Use when an
  application needs responsive bar charts, line charts, aggregate charts,
  heatmaps, or Sankey diagrams; when converting application data into the
  library's chart data shapes; or when implementing chart formatting,
  item-click interactions, accessibility, responsive sizing, or CSS-variable
  theming.
license: MIT
metadata:
  author: chatwoot
  homepage: https://github.com/chatwoot/viz
  source: https://github.com/chatwoot/viz
---

# Chatwoot Viz

Use `@chatwoot/viz` to add small, responsive charts to Vue 3.5+ applications.
The package exports `BarChart`, `DonutChart`, `LineChart`, `PercentageChart`,
`HeatmapChart`, and `SankeyChart`.

## Agent protocol

Before writing chart code:

1. Inspect the consuming project's Vue version, package manager, component
   conventions, design tokens, and test setup.
2. Confirm that the project uses Vue 3.5 or newer. Do not add this package to
   React, Svelte, server-rendered templates without Vue, or Vue 2 projects.
3. Reuse existing application data and tokens. Transform data in a computed
   value instead of duplicating or mutating source records.
4. Import the package stylesheet exactly once in the application's global
   entry point.
5. Give every chart a specific `aria-label` describing the metric and grouping.
6. Verify the chart at narrow and wide container sizes and test any item-click
   behavior with both pointer and keyboard interaction.

Use the project's existing package manager:

```sh
pnpm add @chatwoot/viz
npm install @chatwoot/viz
yarn add @chatwoot/viz
bun add @chatwoot/viz
```

Import the stylesheet once, typically in `main.js`, `main.ts`, or the existing
global CSS entry:

```js
import '@chatwoot/viz/style.css'
```

Import only the components needed by the view:

```js
import {
  BarChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  PercentageChart,
  SankeyChart,
} from '@chatwoot/viz'
```

## Choose a chart

| Component         | Use for                                                                | Avoid when                                                        |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `BarChart`        | Comparing values across discrete categories; grouped or stacked totals | The primary task is reading change over a dense timeline          |
| `DonutChart`      | Circular part-to-whole breakdowns with a useful center                 | Precise comparison across many small segments is primary          |
| `LineChart`       | Trends across ordered categories shared by one or more series          | Categories are unrelated or cumulative composition matters most   |
| `PercentageChart` | Compact part-to-whole breakdowns in a single bar                       | Values can be negative or do not share one meaningful total       |
| `HeatmapChart`    | Values at row/column intersections, density, schedules, cohorts        | Exact values must be compared without hover/focus                 |
| `SankeyChart`     | Directed flows between stages and outcomes                             | The graph contains cycles or links do not represent positive flow |

Do not use a chart when a compact table or a single statistic communicates the
result more clearly.

## Cartesian charts

`BarChart` and `LineChart` use the same base data shape:

```vue
<script setup>
import { computed } from 'vue'
import { LineChart } from '@chatwoot/viz'

const props = defineProps({ report: { type: Object, required: true } })

const chartData = computed(() => ({
  categories: props.report.periods.map((period) => period.label),
  series: [
    {
      id: 'handled',
      label: 'Handled',
      color: 'var(--color-border-strong)',
      data: props.report.periods.map((period) => period.handled),
    },
    {
      id: 'resolved',
      label: 'Resolved',
      color: 'var(--color-primary)',
      data: props.report.periods.map((period) => period.resolved),
    },
  ],
}))
</script>

<template>
  <LineChart :data="chartData" aria-label="Handled and resolved conversations by week" />
</template>
```

Rules for Cartesian data:

- Put x-axis values in `categories`.
- Put each metric in `series`; give every series a stable `id` and human label.
- Keep every series' `data` aligned by category index.
- Use a number for a simple point. Use `{ value, ...metadata }` when click
  handlers need the original record or other metadata.
- `value` and `y` are both accepted as the numeric field on point objects.
- Point objects may include an optional `description` for muted supporting text in tooltips.
- Missing and non-numeric line points break the line. Missing and non-numeric
  bar points are skipped.
- Set `timeseries` on `BarChart` when categories are ordered dates or periods;
  it reduces label density responsively.
- Use `stacked` on `BarChart` only when adding series is meaningful. Positive
  and negative values form separate stacks.

Useful props:

| Prop                                 | Components | Behavior                                                                             |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| `formatValue`                        | Bar, Line  | Function, suffix string such as `"%"`, or template such as `"{value} conversations"` |
| `showTooltip`                        | Bar, Line  | Rich category tooltip; bind `:show-tooltip="false"` to disable                       |
| `showValues`                         | Bar, Line  | Bar defaults to `false`; Line defaults to `true`                                     |
| `yDomain`                            | Bar, Line  | Explicit `[minimum, maximum]`; otherwise inferred                                    |
| `yTicks`                             | Bar, Line  | Explicit tick values inside the domain                                               |
| `yStepSize`                          | Bar, Line  | Positive tick interval or function receiving `{ min, max, values, tickCount }`       |
| `yTickCount`                         | Bar, Line  | Preferred inferred tick count; defaults to `5`                                       |
| `height`                             | Bar, Line  | SVG view-box height; defaults to `360`                                               |
| `barGap`, `barRadius`, `maxBarWidth` | Bar        | Tune grouped/stacked bar geometry; `barRadius` defaults to `4`                       |
| `pointRadius`, `xInset`              | Line       | Tune markers and horizontal plot inset                                               |

Scale options use `yTicks`, then `yStepSize`, then automatic ticks based on
`yTickCount`. A step rounds inferred domain bounds outward while an explicit
`yDomain` remains unchanged. Prefer an inferred domain. Add `yDomain`, `yTicks`,
or `yStepSize` only when the product requires an exact, comparable scale.
Zero-only data uses a non-negative `0` to `1` inferred fallback domain.

## Aggregate charts

`PercentageChart` and `DonutChart` accept the same raw, non-negative segment
values. Without `total`, their sum is treated as 100%. With a positive `total`,
each share is calculated against that capacity and a positive remainder is
rendered automatically as `Unused`.

```vue
<script setup>
import { PercentageChart } from '@chatwoot/viz'

const data = {
  total: 500,
  segments: [
    { id: 'documents', label: 'Documents', value: 100, color: '#e5484d' },
    { id: 'music', label: 'Music', value: 30, color: '#f5a623' },
    { id: 'apps', label: 'Apps', value: 120, color: '#2f80ed' },
  ],
}

const formatStorage = (value) => `${value} GB`
</script>

<template>
  <PercentageChart :data="data" :format-value="formatStorage" aria-label="Storage usage by type">
    <template #legend-item="{ color, formattedValue, label }">
      <span class="legend-swatch" :style="{ backgroundColor: color }" aria-hidden="true" />
      <span>{{ label }}</span>
      <strong>{{ formattedValue }}</strong>
    </template>
  </PercentageChart>
</template>
```

Use the same data in a donut and keep center content in its scoped slot:

```vue
<DonutChart :data="data" :format-value="formatStorage" aria-label="Storage usage by type">
  <template #center="{ used }">
    <strong>{{ formatStorage(used) }} used</strong>
  </template>
</DonutChart>
```

This produces `20%`, `6%`, and `24%` supplied segments plus a derived 50%
unused segment. Tooltips show the formatted raw value and percentage, such as
`250 GB · 50%`. Raw values remain available in legend slots and item-click
payloads.

Aggregate rules:

- Values above an explicit total produce an error instead of being rescaled.
- Invalid and negative values are skipped. An inferred chart needs at least one
  positive value; an explicit total can render as 100% unused.
- `formatValue` formats raw values; `formatPercentage` formats computed
  percentages. Layout retains full precision and display values round to at
  most two decimal places.
- The default legend is predictable: color swatch, label, and formatted
  percentage. Use the `legend-item` slot for business-specific arrangements
  such as raw storage values, rating icons, or supporting counts.
- Both charts retain the legend's `<ul>` and `<li>` semantics. Slot props are
  `item`, `id`, `index`, `label`, `color`, `value`, `percentage`,
  `formattedValue`, `formattedPercentage`, `description`, and `isRemainder`.
- A segment object's optional `description` renders as muted tooltip text and
  is included in its accessible label. It uses the `description` field
  directly; there is no custom description accessor.
- Keep headings, summaries, units, precision, icons, and other business
  presentation in the consuming view. Use the `remainderLabel` and
  `remainderColor` props to customize the derived segment.
- `showTooltip` and `showLegend` control both charts. Percentage geometry uses
  `barHeight` (`24`), `barGap` (`2`), and `barRadius` (`4`). Donut geometry
  uses `diameter` (`200`), `thickness` (`24`), a constant-width `segmentGap` (`3`), and
  `cornerRadius` (`2`).
- Donut's optional `center` slot receives `total`, `used`, `remainder`, and
  `hasExplicitTotal`.

## Heatmaps

Use client-provided row and column labels. The component does not parse dates,
calculate weekdays, apply timezones, or localize labels.

```vue
<script setup>
import { HeatmapChart } from '@chatwoot/viz'

const data = {
  columns: [
    { id: '09', label: '09:00' },
    { id: '10', label: '10:00' },
    { id: '11', label: '11:00' },
  ],
  rows: [
    {
      id: 'monday',
      label: 'Monday',
      description: 'Aug 10, 2026',
      data: [2, { value: 8, ticketIds: [41, 42] }, null],
    },
  ],
}
</script>

<template>
  <HeatmapChart
    :data="data"
    :domain="[0, 10]"
    aria-label="Conversation volume by weekday and hour"
  />
</template>
```

Heatmap rules:

- `columns` may contain strings, numbers, or objects. Prefer objects with
  stable `id` and display `label`.
- Each row supports `id`, `label`, optional `description`, and `data` or
  `values`.
- A cell may be a number or an object with `value` or `count`.
- A cell object may specify `color` with any CSS color or `var(--token)`.
- `null`, missing, and non-numeric cells render as empty, non-interactive cells.
- The color domain is inferred across numeric cells. Pass `domain` when several
  heatmaps must use the same scale.
- `colors` supplies the quantized palette, and its length determines the number
  of levels. It defaults to five CSS-variable-aware colors. Cell colors take
  precedence over the shared palette.
- `cellHeight` (`32`), `cellMinWidth` (`28`), `gap` (`4`), and
  `rowLabelWidth` (`120`) control density. The matrix scrolls horizontally when
  it cannot fit its container.
- `formatValue` accepts the same function/string forms as Cartesian charts.

## Sankey diagrams

```vue
<script setup>
import { SankeyChart } from '@chatwoot/viz'

const data = {
  nodes: [
    { id: 'handled', label: 'Handled', count: 9, color: 'var(--color-primary)' },
    { id: 'resolved', label: 'Resolved', count: 3, color: '#038574' },
    { id: 'handoff', label: 'Handed off', count: 6, color: '#915930' },
  ],
  links: [
    { source: 'handled', target: 'resolved', value: 3 },
    { source: 'handled', target: 'handoff', value: 6 },
  ],
}
</script>

<template>
  <SankeyChart
    :data="data"
    :format-value="(value) => value.toLocaleString()"
    aria-label="Conversation outcomes from handled conversations"
  />
</template>
```

Sankey rules:

- Give every node a unique `id`; `label`, `count`/`value`, and `color` are
  optional.
- Connect links with `source`, `target`, and a positive `value`. An endpoint
  may be a node id, zero-based node index, or node object.
- Keep the graph directed and acyclic.
- A node value is inferred from connected links when its own value is absent.
- A link without a color inherits its target node's color with reduced opacity.
- Unlike the other charts, `SankeyChart` accepts only a function for
  `formatValue`, not a suffix or template string.
- Use `nodeWidth` (`10`), `nodePadding` (`28`), `height` (`340`), and
  `showLabelBackground` to tune layout without rewriting SVG output.

## Item interactions

Attach `@item-click` when selecting a visual item should navigate, filter, or
open details. Do not add separate click targets over the chart. The components
already support mouse, Enter, and Space interaction.

```vue
<script setup>
const emit = defineEmits(['select'])

function selectItem(payload) {
  // payload.item, payload.category, and payload.series are original input data.
  emit('select', payload)
}
</script>

<template>
  <BarChart :data="data" @item-click="selectItem" />
</template>
```

Payloads:

| Chart             | Common payload fields                                                   | Additional fields                                                                        |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Bar, Line         | `item`, `value`, `formattedValue`, `event`                              | Original `category` and `series`; ids, labels, and indexes                               |
| Heatmap           | `itemType: "cell"`, `item`, `value`, `formattedValue`, `event`          | Original `row` and `column`; ids, labels, descriptions, and indexes                      |
| Percentage, Donut | `item`, `value`, `formattedValue`, `event`, `index`                     | Calculated percentage, formatted percentage, description, id, label, and remainder state |
| Sankey node       | `itemType: "node"`, `item`, `value`, `formattedValue`, `event`, `index` | `id`, `label`                                                                            |
| Sankey link       | `itemType: "link"`, `item`, `value`, `formattedValue`, `event`, `index` | Original source/target nodes plus their ids and labels                                   |

Prefer point or cell objects when a handler needs metadata; `item` preserves
the original object. Keep navigation and application state changes in the
consumer's callback rather than inside transformed chart data.

## Custom data accessors

Adapt existing application schemas with accessor props instead of cloning
records solely to rename fields:

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

- Bar and Line: `categoryLabel`, `seriesId`, `seriesLabel`, `seriesValues`,
  `pointValue`, `pointDescription`, and color accessors. `pointDescription` defaults to the
  point object's optional `description` field.
- Heatmap: `columnId`, `columnLabel`, `rowId`, `rowLabel`, `rowDescription`,
  `rowValues`, `cellValue`, and `cellColor`.
- Percentage and Donut: `segmentId`, `segmentLabel`, `segmentValue`, and
  `segmentColor`.
- Sankey: `nodeId`, `nodeLabel`, `nodeValue`, `nodeColor`, `linkValue`, and
  `linkColor`.

## Responsiveness, accessibility, and theming

Bar, Line, and Sankey charts observe their container width and recalculate
their layout. Aggregate charts scale to their container with CSS. Give the
parent a real width and `min-width: 0` when it is inside a flex or grid layout.
`width` on charts that accept it is a fallback before measurement, not normally
a fixed rendered width.

Use data-level colors for individual series, nodes, links, and cells. Use
`--cw-viz-*` CSS custom properties for shared presentation:

```css
.analytics-chart {
  --cw-viz-line-width: 2px;
  --cw-viz-line-tooltip-background: var(--color-surface);
  --cw-viz-bar-tooltip-background: var(--color-surface);
  --cw-viz-heatmap-level-0-color: var(--color-surface-subtle);
  --cw-viz-heatmap-level-4-color: var(--color-primary);
  --cw-viz-donut-remainder-color: var(--color-surface-subtle);
  --cw-viz-donut-tooltip-background: var(--color-surface);
  --cw-viz-percentage-remainder-color: var(--color-surface-subtle);
  --cw-viz-percentage-tooltip-background: var(--color-surface);
}
```

Do not remove focus styles, replace semantic buttons with click-only elements,
or use color as the only explanation of a metric. Keep labels concise and pass
a useful `aria-label`, even though every component has a generic default.

## Common mistakes

| Mistake                                                | Fix                                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Importing only the component                           | Import `@chatwoot/viz/style.css` once globally                    |
| Passing `show-tooltip="false"`                         | Bind the Boolean: `:show-tooltip="false"`                         |
| Using series arrays of different meaning/order         | Align every point to the same category index                      |
| Calculating dates inside `HeatmapChart`                | Localize and label rows/columns in the client                     |
| Passing precomputed percentage labels                  | Pass raw values and let aggregate charts calculate them           |
| Letting percentage values exceed an explicit total     | Correct the values or increase the shared total                   |
| Passing zero/negative Sankey links or cyclic data      | Validate positive flows and a directed acyclic graph              |
| Passing `format-value="%"` to Sankey                   | Pass a function: `:format-value="(value) => String(value) + '%'"` |
| Hard-coding chart width to make it responsive          | Size the container; let the chart's observer measure it           |
| Rebuilding accessible click behavior outside the chart | Use `@item-click` and the supplied payload                        |
| Mutating API data into the chart shape                 | Derive chart data with `computed`                                 |

## Verification

After implementation:

1. Run the consuming project's formatter, linter, tests, and production build.
2. Confirm the number and order of categories, series, aggregate segments,
   rows, columns, nodes, and links against the source data.
3. Check empty, missing, zero, negative, and unusually large values relevant to
   the selected chart.
4. Resize the container below and above its normal width; check clipped labels,
   tooltips, and heatmap scrolling.
5. Focus interactive points/cells/segments/nodes/links and activate them with
   Enter and Space. Confirm the handler receives the original input objects.
6. Check that the chart has an accurate accessible name and remains readable
   with the consuming application's light/dark theme tokens.
