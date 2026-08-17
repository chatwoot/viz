Use `DonutChart` for a compact circular part-to-whole breakdown. It accepts the same raw segment data and calculation rules as `PercentageChart`, including explicit totals and derived unused capacity.

```vue
<script setup>
import { DonutChart } from '@chatwoot/viz'

const data = {
  segments: [
    { id: 'excellent', label: 'Excellent', value: 62, color: '#3ecf4c' },
    { id: 'good', label: 'Good', value: 27, color: '#6bd36e' },
    { id: 'average', label: 'Average', value: 19, color: '#ffed55' },
    { id: 'fair', label: 'Fair', value: 9, color: '#ffbf2f' },
    { id: 'poor', label: 'Poor', value: 75, color: '#ffad28' },
  ],
}

const icons = {
  excellent: '😍',
  good: '😀',
  average: '😐',
  fair: '😑',
  poor: '😞',
}

const formatPercentage = (value) => `${Number(value).toFixed(2)}%`
</script>

<template>
  <section>
    <h2>Rating distribution</h2>
    <DonutChart :data="data" :format-percentage="formatPercentage" aria-label="Rating distribution">
      <template #center="{ total }">
        <strong>{{ total }} responses</strong>
      </template>
      <template #legend-item="{ formattedPercentage, formattedValue, id, label }">
        <span aria-hidden>{{ icons[id] }}</span>
        <span>{{ label }}</span>
        <strong>{{ formattedPercentage }}</strong>
        <span>({{ formattedValue }})</span>
      </template>
    </DonutChart>
  </section>
</template>
```

## Calculation and display

- Without `total`, valid non-negative segment values are normalized against their sum.
- With a positive `total`, segment percentages use that capacity and a positive remainder is added as `Unused`.
- Invalid and negative values are skipped. Values above an explicit total render an error.
- `diameter` defaults to `200`, `thickness` to `24`, `segmentGap` to a constant-width `3`, and `cornerRadius` to a subtle `2`.
- Segments use lightly rounded corners and expand smoothly from the center on hover or keyboard focus.
- `formatValue`, `formatPercentage`, `remainderLabel`, `remainderColor`, the segment accessors, `showLegend`, and `showTooltip` match `PercentageChart`.

The default legend renders a swatch, label, and calculated percentage. The `legend-item` slot receives `item`, `id`, `index`, `label`, `color`, `value`, `percentage`, `formattedValue`, `formattedPercentage`, `description`, and `isRemainder`.

The optional `center` slot receives `total`, `used`, `remainder`, and `hasExplicitTotal`. Keep units, summary labels, icons, and other business presentation in these consumer-owned slots rather than chart data.

## Tooltip descriptions

Add an optional `description` directly to a segment object. It appears as muted tooltip text and is included in the segment's accessible label.

```js
{
  id: 'excellent',
  label: 'Excellent',
  value: 62,
  description: 'Based on 62 responses',
}
```

## Item clicks

Pass an `onItemClick` callback or use `@item-click`. Every visible arc supports pointer, Enter, and Space activation.

```vue
<DonutChart :data="data" @item-click="openRatingDetails" />
```

The payload contains the original `item`, raw and formatted values, calculated and formatted percentages, optional description, id, label, index, remainder state, and native event.

## Theming

Use data-level colors for segments. Shared presentation can be changed with `--cw-viz-donut-*` variables, including `--cw-viz-donut-remainder-color`, `--cw-viz-donut-focus-color`, `--cw-viz-donut-label-color`, and the tooltip and legend variables.
