# @chatwoot/viz

Tiny, responsive SVG chart components for Vue 3.5 and newer, built for Chatwoot.

The library currently includes grouped and stacked bar charts, a multi-series
line chart, a matrix heatmap, and a dependency-free Sankey chart. The Cartesian
charts share the same responsive scale, axis, accessor, and formatting helpers.

## Requirements

- Node.js 24.4.1 or newer
- pnpm 10.2.0
- Vue 3.5 or newer in consuming applications

## Development

```sh
pnpm install
pnpm dev
```

### Bundle analysis

Generate an interactive treemap with raw, gzip, and Brotli size estimates:

```bash
pnpm analyze
```

Open `bundle-report.html` in a browser. The report is generated only for the
analysis build and is ignored by Git.

The Vite playground exposes an overview at `/` and editable chart stories at
`/bar`, `/heatmap`, `/line`, and `/sankey`. The overview renders every chart from its saved data,
falling back to the defaults when needed. The JSON editor validates input as
you type and stores a separate draft for each chart in localStorage. It loads
JSON syntax highlighting from Shiki's browser CDN, with plain text as its
offline fallback. Drag the canvas's lower-right corner to test a chart at
different container widths and heights.

Useful commands:

```sh
pnpm build         # Build the ESM library into dist/
pnpm test          # Run Vitest and Vue Test Utils tests
pnpm test:watch    # Run tests in watch mode
pnpm lint          # Check JavaScript and Vue script blocks with Oxlint
pnpm format        # Format supported project files with Oxfmt
pnpm check         # Run all checks and the production build
```

## Usage

The package is not published yet. Once installed or linked locally:

Import the stylesheet once in the consuming application:

```js
import '@chatwoot/viz/style.css'
```

## Bar chart

The bar chart uses the same `{ categories, series }` shape as the line chart.
Multiple series render side by side by default. Add `stacked` to accumulate
positive and negative values independently within each category.

```vue
<script setup>
import { BarChart } from '@chatwoot/viz'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21'],
  series: [
    { id: 'automated', label: 'Automated', color: '#009688', data: [38, 48, 42] },
    { id: 'team', label: 'Team', color: '#b9bbc6', data: [24, 31, 27] },
  ],
}
</script>

<template>
  <BarChart :data="data" aria-label="Conversation volume by week" />
  <BarChart :data="data" stacked aria-label="Stacked conversation volume by week" />
</template>
```

The inferred y-axis always includes zero. In stacked mode it uses category
totals, not individual segments. `formatValue` applies to ticks, optional value
labels, and the rich HTML tooltip.

### Bar chart props

| Prop               | Default                                  | Purpose                                                       |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------- |
| `data`             | required                                 | `{ categories, series }` bar data                             |
| `stacked`          | `false`                                  | Stack series instead of placing them side by side             |
| `timeseries`       | `false`                                  | Thin dense time labels while retaining the first and last     |
| `height`           | `360`                                    | SVG layout height                                             |
| `width`            | `960`                                    | Initial/SSR width before the container is measured            |
| `barRadius`        | `6`                                      | Radius applied to the exposed end of each bar or stack        |
| `barGap`           | `6`                                      | Gap between grouped bars                                      |
| `maxBarWidth`      | `48`                                     | Maximum width of a grouped bar or complete stack              |
| `showValues`       | `false`                                  | Show formatted values on or beside bars                       |
| `showTooltip`      | `true`                                   | Show an HTML tooltip with every series for a category         |
| `yDomain`          | inferred                                 | Optional `[minimum, maximum]` numeric domain                  |
| `yTicks`           | inferred                                 | Optional array of exact y-axis tick values                    |
| `yTickCount`       | `5`                                      | Target tick count when ticks are inferred                     |
| `categoryLabel`    | `category => category.label ?? category` | Category label accessor                                       |
| `seriesId`         | `series => series.id`                    | Series id accessor                                            |
| `seriesLabel`      | label, id, then generated label          | Accessible series label accessor                              |
| `seriesValues`     | `series => series.data ?? series.values` | Series point-array accessor                                   |
| `pointValue`       | number, `value`, then `y`                | Numeric point accessor                                        |
| `seriesColor`      | `series => series.color`                 | Bar color or accessor                                         |
| `seriesValueColor` | value or label color                     | Optional outside-value-label color or accessor                |
| `formatValue`      | locale number formatting                 | String template/suffix or function for ticks and point values |
| `ariaLabel`        | `Bar chart`                              | Accessible chart name                                         |

### Bar chart CSS variables

```css
.cw-viz-bar {
  --cw-viz-bar-axis-color: #d9d9e0;
  --cw-viz-bar-zero-line-color: #b9bbc6;
  --cw-viz-bar-label-color: #60646c;
  --cw-viz-bar-value-color: #60646c;
  --cw-viz-bar-value-inside-color: #ffffff;
  --cw-viz-bar-axis-font-size: 12px;
  --cw-viz-bar-value-font-size: 12px;
  --cw-viz-bar-tooltip-background: #ffffff;
  --cw-viz-bar-tooltip-border-color: #e0e1e6;
  --cw-viz-bar-tooltip-color: #1c2024;
  --cw-viz-bar-tooltip-label-color: #60646c;
  --cw-viz-bar-tooltip-shadow: 0 4px 16px rgb(0 0 0 / 10%);
  --cw-viz-bar-tooltip-font-size: 12px;
}
```

Series fallback colors can be set by index or id, for example
`--cw-viz-bar-series-0-color` or `--cw-viz-bar-series-automated-color`.

## Heatmap chart

The heatmap accepts any number of rows and columns. This 24-column example uses
client-provided labels for hours, days, and dates; the component does not parse,
localize, or derive any of them.

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

Numeric cells are assigned to five color buckets across an inferred domain.
Pass `domain` to share an exact scale between heatmaps. Cell objects may use
`value` or `count` and can provide a `color` override as a hex value or CSS
variable. Hovering or focusing a cell opens a rich HTML tooltip.

### Heatmap props

| Prop             | Default                                  | Purpose                                              |
| ---------------- | ---------------------------------------- | ---------------------------------------------------- |
| `data`           | required                                 | `{ columns, rows }` matrix data                      |
| `domain`         | inferred                                 | Optional `[minimum, maximum]` shared color domain    |
| `cellHeight`     | `32`                                     | Cell height in pixels                                |
| `cellMinWidth`   | `28`                                     | Minimum cell width before horizontal scrolling       |
| `gap`            | `4`                                      | Gap between cells                                    |
| `rowLabelWidth`  | `120`                                    | Width reserved for row labels                        |
| `showTooltip`    | `true`                                   | Enable focusable cells and the rich HTML tooltip     |
| `columnId`       | id, then index                           | Column id accessor                                   |
| `columnLabel`    | `column => column.label ?? column`       | Client-provided column label accessor                |
| `rowId`          | id, then index                           | Row id accessor                                      |
| `rowLabel`       | label, id, then index                    | Client-provided primary row label accessor           |
| `rowDescription` | description, sublabel, then empty string | Client-provided secondary row label accessor         |
| `rowValues`      | `row => row.data ?? row.values`          | Row cell-array accessor                              |
| `cellValue`      | number, `value`, then `count`            | Numeric cell accessor                                |
| `cellColor`      | `cell => cell.color`                     | Optional per-cell color accessor                     |
| `formatValue`    | locale number formatting                 | String template/suffix or tooltip formatter function |
| `ariaLabel`      | `Heatmap chart`                          | Accessible chart name                                |

### Heatmap CSS variables

```css
.cw-viz-heatmap {
  --cw-viz-heatmap-level-0-color: #f8f8fa;
  --cw-viz-heatmap-level-1-color: #e2efff;
  --cw-viz-heatmap-level-2-color: #bdd9fb;
  --cw-viz-heatmap-level-3-color: #8ab6f0;
  --cw-viz-heatmap-level-4-color: #1c73dc;
  --cw-viz-heatmap-cell-border-color: rgb(62 99 221 / 8%);
  --cw-viz-heatmap-cell-radius: 3px;
  --cw-viz-heatmap-label-color: #60646c;
  --cw-viz-heatmap-row-title-color: #1c2024;
  --cw-viz-heatmap-tooltip-background: #ffffff;
  --cw-viz-heatmap-tooltip-border-color: #e0e1e6;
}
```

## Line chart

The line chart accepts categories and any number of series. A point can be a
number or an object with a `value` or `y` field.

```vue
<script setup>
import { LineChart } from '@chatwoot/viz'

const data = {
  categories: ['Jun 01 - 07', 'Jun 08 - 14', 'Jun 15 - 21', 'Jun 22 - 30'],
  series: [
    {
      id: 'handled',
      label: 'Handled',
      color: '#d9d9e0',
      pointBorderColor: '#ebebef',
      pointColor: '#b9bbc6',
      valueColor: '#60646c',
      data: [30, 40, 35, 51],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      color: '#009688',
      pointBorderColor: '#ccf3ee',
      data: [12, 29, 23, 39],
    },
  ],
}
</script>

<template>
  <LineChart :data="data" format-value="%" aria-label="Conversation trends by week" />
</template>
```

Pass a string to append a suffix to every value, or use `{value}` to place the
locale-formatted number within a template. For custom logic, pass a function:

```vue
<LineChart :data="data" format-value="{value}%" />
<LineChart :data="data" :format-value="(value, point, series) => `${value}%`" />
```

### Line chart props

| Prop                     | Default                                  | Purpose                                                       |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------- |
| `data`                   | required                                 | `{ categories, series }` line data                            |
| `height`                 | `360`                                    | SVG layout height                                             |
| `width`                  | `960`                                    | Initial/SSR width before the container is measured            |
| `pointRadius`            | `5`                                      | Marker radius                                                 |
| `showValues`             | `true`                                   | Show a formatted value next to each marker                    |
| `showTooltip`            | `true`                                   | Show an HTML tooltip with all series values for a category    |
| `yDomain`                | inferred                                 | Optional `[minimum, maximum]` numeric domain                  |
| `yTicks`                 | inferred                                 | Optional array of exact y-axis tick values                    |
| `yTickCount`             | `5`                                      | Target tick count when ticks are inferred                     |
| `xInset`                 | responsive                               | Horizontal inset for the first and last points                |
| `categoryLabel`          | `category => category.label ?? category` | Category label accessor                                       |
| `seriesId`               | `series => series.id`                    | Series id accessor                                            |
| `seriesLabel`            | label, id, then generated label          | Accessible series label accessor                              |
| `seriesValues`           | `series => series.data ?? series.values` | Series point-array accessor                                   |
| `pointValue`             | number, `value`, then `y`                | Numeric point accessor                                        |
| `seriesColor`            | `series => series.color`                 | Line color or accessor                                        |
| `seriesPointColor`       | `series => series.pointColor`            | Marker color or accessor; falls back to the line color        |
| `seriesPointBorderColor` | `series => series.pointBorderColor`      | Marker-ring color or accessor; falls back to the CSS variable |
| `seriesValueColor`       | value or label color                     | Point-label color or accessor; falls back to line color       |
| `formatValue`            | locale number formatting                 | String template/suffix or function for ticks and point values |
| `ariaLabel`              | `Line chart`                             | Accessible chart name                                         |

### Line chart CSS variables

```css
.cw-viz-line {
  --cw-viz-line-axis-color: #d9d9e0;
  --cw-viz-line-label-color: #60646c;
  --cw-viz-line-width: 2px;
  --cw-viz-line-point-border-color: #ffffff;
  --cw-viz-line-point-border-width: 6px;
  --cw-viz-line-axis-font-size: 12px;
  --cw-viz-line-value-font-size: 12px;
  --cw-viz-line-tooltip-background: #ffffff;
  --cw-viz-line-tooltip-border-color: #e0e1e6;
  --cw-viz-line-tooltip-color: #1c2024;
  --cw-viz-line-tooltip-label-color: #60646c;
  --cw-viz-line-tooltip-shadow: 0 4px 16px rgb(0 0 0 / 10%);
  --cw-viz-line-tooltip-font-size: 12px;
}
```

Series-specific fallback colors can be set by index or id, for example
`--cw-viz-line-series-0-color` or `--cw-viz-line-series-resolved-color`.

## Sankey chart

The Sankey data shape follows the familiar
[Unovis Sankey format](https://unovis.dev/docs/networks-and-flows/Sankey/): an
array of node data and an array of links whose `source` and `target` refer to
those nodes.

```vue
<script setup>
import { SankeyChart } from '@chatwoot/viz'

const data = {
  nodes: [
    { id: 'handled', label: 'Handled', count: 9, color: 'var(--handled-color)' },
    { id: 'resolved', label: 'Resolved by Captain', count: 3, color: '#038574' },
  ],
  links: [{ source: 'handled', target: 'resolved', value: 3 }],
}
</script>

<template>
  <SankeyChart :data="data" aria-label="Conversation resolution flow" />
</template>

<style scoped>
.cw-viz-sankey {
  --handled-color: #4747c2;
}
</style>
```

### Sankey data

`data.nodes` accepts arbitrary objects. By default, the component reads `id`,
`label`, `count`, and `color`. `data.links` reads `source`, `target`, `value`,
and optional `color`.

- `source` and `target` can be a node id, a zero-based node index, or a node
  object.
- `value` controls ribbon thickness. Values must be positive numbers.
- Node values are inferred from their links when `count`/`value` is omitted.
- `color` accepts any SVG color, including raw hex values and `var(--token)`.
- The graph must be directed and acyclic.

The accessors can be replaced when an application uses different field names:

```vue
<SankeyChart
  :data="data"
  :node-id="(node) => node.key"
  :node-label="(node) => node.name"
  :node-value="(node) => node.total"
  :node-color="(node) => node.fill"
  :link-value="(link) => link.amount"
  :link-color="(link) => link.fill"
/>
```

### Sankey props

| Prop                  | Default                                 | Purpose                                                     |
| --------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `data`                | required                                | `{ nodes, links }` Sankey data                              |
| `height`              | `340`                                   | SVG layout height                                           |
| `width`               | `960`                                   | Initial/SSR width before the container is measured          |
| `nodeWidth`           | `10`                                    | Node bar width                                              |
| `nodePadding`         | `28`                                    | Vertical gap between nodes in a column                      |
| `nodeId`              | `node => node.id`                       | Node id accessor                                            |
| `nodeLabel`           | `node => node.label ?? node.id`         | Visible label accessor                                      |
| `nodeValue`           | `node => node.count ?? node.value ?? 0` | Displayed node value accessor                               |
| `nodeColor`           | `node => node.color`                    | Node color or accessor                                      |
| `linkValue`           | `link => link.value ?? 1`               | Link value accessor                                         |
| `linkColor`           | `link => link.color`                    | Link color or accessor; falls back to the target node color |
| `formatValue`         | locale number formatting                | Label value formatter                                       |
| `showLabelBackground` | `true`                                  | Draw label backgrounds; non-terminal labels include borders |
| `ariaLabel`           | `Sankey diagram`                        | Accessible chart name                                       |

The chart observes its own container and recalculates horizontal positions as
the available width changes. No sizing utility is required.

### Sankey CSS variables

```css
.cw-viz-sankey {
  --cw-viz-sankey-node-color: #4747c2;
  --cw-viz-sankey-node-resolved-color: #038574;
  --cw-viz-sankey-link-opacity: 0.2;
  --cw-viz-sankey-link-hover-opacity: 0.34;
  --cw-viz-sankey-node-opacity: 1;
  --cw-viz-sankey-label-color: #60646c;
  --cw-viz-sankey-label-value-color: #1c2024;
  --cw-viz-sankey-label-background: #fcfcfd;
  --cw-viz-sankey-label-border-color: #ebebef;
  --cw-viz-sankey-label-font-size: 13px;
}
```

Node-specific fallback variables are derived from ids. For example, the node id
`resolved` reads `--cw-viz-sankey-node-resolved-color` before the global node
color. A `color` supplied by the node or `nodeColor` accessor takes precedence.

## Packaging

`vite.config.js` has a single library entry at `src/index.js`, emits modern ESM,
and keeps Vue external as a peer dependency. `index.html` and `playground/` are
development inputs only and are not included in the package's `dist` output.

The setup follows the current official guidance for
[Vue tooling](https://vuejs.org/guide/quick-start.html),
[Vite library mode](https://vite.dev/guide/build.html#library-mode),
[Oxlint](https://oxc.rs/docs/guide/usage/linter.html),
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html), and
[Vue Test Utils](https://test-utils.vuejs.org/installation/).

## License

[MIT](./LICENSE)
