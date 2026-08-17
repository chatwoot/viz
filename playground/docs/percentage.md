Use `PercentageChart` for a part-to-whole breakdown in one compact horizontal bar. Pass raw values and let the chart calculate percentages. Keep headings, units, precision, icons, and other business presentation in the consuming view.

## Normalize a complete allocation

Omit `total` when the supplied values represent the whole. Their sum becomes 100%. The default legend renders each color, label, and calculated percentage.

```vue
<script setup>
import { PercentageChart } from '@chatwoot/viz'

const data = {
  segments: [
    { id: 'assistant', label: 'Assistant', value: 40, color: '#4747c2' },
    { id: 'tasks', label: 'Tasks', value: 30, color: '#ab4aba' },
    { id: 'copilot', label: 'Copilot', value: 30, color: '#009688' },
  ],
}
</script>

<template>
  <section>
    <h2>Credit usage</h2>
    <PercentageChart :data="data" aria-label="Credit usage by product" />
  </section>
</template>
```

## Show unused capacity

Pass a positive `total` to use a fixed capacity. When segment values add up to less than the total, the chart derives an `Unused` segment automatically.

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

The tooltips still show both values, such as `100 GB · 20%`. Use the `remainderLabel` and `remainderColor` props to customize the derived segment.

## Customize legend content

The chart owns the legend's accessible `<ul>` and `<li>` structure. The `legend-item` slot only replaces the contents of each item, so consumers can arrange icons and values without putting presentation fields in chart data.

```vue
<PercentageChart
  :data="ratings"
  :format-percentage="(value) => `${Number(value).toFixed(2)}%`"
  aria-label="Rating distribution"
>
  <template #legend-item="{ formattedPercentage, formattedValue, id, label }">
    <span aria-hidden>{{ ratingIcons[id] }}</span>
    <span>{{ label }}</span>
    <strong>{{ formattedPercentage }}</strong>
    <span>({{ formattedValue }})</span>
  </template>
</PercentageChart>
```

Slot props are `item`, `id`, `index`, `label`, `color`, `value`, `percentage`, `formattedValue`, `formattedPercentage`, `description`, and `isRemainder`. A derived remainder has `item: null` and `isRemainder: true`.

## Tooltip descriptions

A segment object may include `description`. The chart renders it as muted tooltip text and includes it in the segment's accessible label.

```js
{
  id: 'excellent',
  label: 'Excellent',
  value: 62,
  description: 'Based on 62 responses',
}
```

## Calculation rules

- Segment values must be finite and non-negative. Invalid and negative values are skipped.
- Without `total`, the sum of valid values becomes 100%.
- With `total`, each percentage is `value / total × 100` and a positive remainder is added as `Unused`.
- Segment values above an explicit total show an error instead of being silently rescaled.
- Layout uses full-precision percentages. The default display rounds to at most two decimal places.

## Formatting and display

- `formatValue` formats raw values in tooltips and exposes `formattedValue` to the legend slot.
- `formatPercentage` formats calculated percentages in the default legend and tooltips.
- `showTooltip` and `showLegend` default to `true`.
- `barHeight` (`24`), `barGap` (`2`), and `barRadius` (`4`) control the segmented bar.
- `segmentId`, `segmentLabel`, `segmentValue`, and `segmentColor` adapt custom data shapes.

## Item clicks

Pass an `onItemClick` callback, or use `@item-click`. Segment buttons support pointer, Enter, and Space activation.

```vue
<PercentageChart :data="data" @item-click="openUsageDetails" />
```

The payload contains the original `item`, raw `value`, calculated `percentage`, formatted values, optional `description`, id, label, index, and native event. A derived remainder uses `itemType: 'remainder'`, `isRemainder: true`, and `item: null`.

## Theming

Segment colors normally come from data. Shared presentation can be changed with variables including `--cw-viz-percentage-remainder-color`, `--cw-viz-percentage-label-color`, `--cw-viz-percentage-focus-color`, and the `--cw-viz-percentage-tooltip-*` variables.
