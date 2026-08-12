Use `LineChart` for one or more series that share the same categories.

## Data

- `categories` controls the x-axis labels.
- `series` accepts any number of lines.
- Each series supports `id`, `label`, `color`, `pointColor`, `pointBorderColor`, `valueColor`, and `data`.
- A data point can be a number or an object with a `value` or `y` field.

```json
{
  "categories": ["Jun 01 - 07", "Jun 08 - 14"],
  "series": [
    {
      "id": "resolved",
      "label": "Resolved",
      "color": "#009688",
      "data": [12, 29]
    }
  ]
}
```

## Value labels

Pass `format-value="%"` to append a suffix, `format-value="{value}%"` for a template, or a function for custom formatting.

```vue
<LineChart :data="data" format-value="%" />
<LineChart :data="data" :format-value="(value) => `${value}%`" />
```

The y-axis range and ticks are inferred from the supplied values. Use `yDomain` or `yTicks` only when an exact scale is required.

## Tooltip

Hover or focus a point to see an HTML tooltip containing the category and all available series values. Set `showTooltip` to `false` to disable it.
