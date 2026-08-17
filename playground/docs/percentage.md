Use `PercentageChart` for a part-to-whole breakdown in one compact horizontal bar. Each input segment carries its raw value; the chart calculates percentages and includes the raw value in tooltips when it differs from the calculated percentage or a fixed total is supplied.

## Normalize a complete allocation

Omit `total` when the supplied values represent the whole. The chart uses their sum as 100%.

```vue
<script setup>
import { PercentageChart } from '@chatwoot/viz'

const data = {
  title: 'Credit usage',
  segments: [
    { id: 'assistant', label: 'Assistant', value: 40, color: '#4747c2' },
    { id: 'tasks', label: 'Tasks', value: 30, color: '#ab4aba' },
    { id: 'copilot', label: 'Copilot', value: 30, color: '#009688' },
  ],
}
</script>

<template>
  <PercentageChart :data="data" aria-label="Credit usage by product" />
</template>
```

## Show unused capacity

Pass a positive `total` to use a fixed capacity. When segment values add up to less than the total, the chart derives an `Unused` segment automatically.

```vue
<script setup>
import { PercentageChart } from '@chatwoot/viz'

const data = {
  title: 'Storage',
  total: 500,
  segments: [
    { id: 'documents', label: 'Documents', value: 100, color: '#e5484d' },
    { id: 'music', label: 'Music', value: 30, color: '#f5a623' },
    { id: 'apps', label: 'Apps', value: 120, color: '#2f80ed' },
  ],
}
</script>

<template>
  <PercentageChart :data="data" format-value=" GB" aria-label="Storage usage by type" />
</template>
```

This renders `250 GB of 500 GB used`, calculates the three supplied percentages, and adds an `Unused` legend item with `250 GB`. Its tooltip shows `250 GB · 50%`.

## Calculation rules

- Segment values must be finite and non-negative. Invalid and negative values are skipped.
- Without `total`, the sum of valid values becomes 100%.
- With `total`, each percentage is `value / total × 100` and the positive remainder is added as `Unused`.
- Segment values above an explicit total show an error instead of being silently rescaled.
- Layout uses full-precision percentages. Display percentages are rounded to at most two decimal places.

Set `data.summary` to override the generated header summary. Set `data.remainderLabel` or `data.remainderColor` to customize the derived segment.

## Formatting and display

- `formatValue` formats raw values for fixed-total summaries, legends, and tooltips.
- `formatPercentage` formats calculated percentages and defaults to `%`. Fixed-total legends stay compact and show only the raw value; their tooltips show both.
- `showTooltip` and `showLegend` default to `true`.
- `barHeight` (`24`), `barGap` (`2`), and `barRadius` (`4`) control the segmented bar.
- `segmentId`, `segmentLabel`, `segmentValue`, and `segmentColor` adapt custom data shapes.

## Item clicks

Pass an `onItemClick` callback, or use `@item-click`. Segment buttons support pointer, Enter, and Space activation.

```vue
<PercentageChart :data="data" @item-click="openUsageDetails" />
```

The payload contains the original `item`, raw `value`, calculated `percentage`, formatted values, id, label, index, and native event. A derived remainder uses `itemType: 'remainder'`, `isRemainder: true`, and `item: null`.

## Theming

Segment colors normally come from data. Shared presentation can be changed with variables including `--cw-viz-percentage-remainder-color`, `--cw-viz-percentage-label-color`, `--cw-viz-percentage-title-color`, `--cw-viz-percentage-summary-color`, `--cw-viz-percentage-focus-color`, and the `--cw-viz-percentage-tooltip-*` variables.
