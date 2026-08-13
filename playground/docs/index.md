# @chatwoot/viz

`@chatwoot/viz` provides small, responsive Vue chart components with shared formatting, accessible interactions, and rich HTML tooltips.

## Charts

| Component      | Use it for                        | Guide                       |
| -------------- | --------------------------------- | --------------------------- |
| `BarChart`     | Grouped or stacked comparisons    | [Bar chart](./bar.md)       |
| `HeatmapChart` | Row-and-column matrices           | [Heatmap](./heatmap.md)     |
| `LineChart`    | Multi-series trends               | [Line chart](./line.md)     |
| `SankeyChart`  | Flows between stages and outcomes | [Sankey chart](./sankey.md) |

Each chart guide documents its data shape, Vue API, formatting, interactions, and customization options.

## Installation

```sh
pnpm add @chatwoot/viz
```

Import the stylesheet once in the consuming application:

```js
import '@chatwoot/viz/style.css'
```

Components are exported individually from the package entry point:

```js
import { BarChart, HeatmapChart, LineChart, SankeyChart } from '@chatwoot/viz'
```

Vue is a peer dependency. The library ships as modern ESM so a consuming application can tree-shake unused component exports.

## Shared formatting

Every chart accepts `formatValue`. Pass a suffix, a `{value}` template, or a function for custom presentation.

```vue
<LineChart :data="data" format-value="%" />
<BarChart :data="data" format-value="{value} conversations" />
<HeatmapChart :data="data" :format-value="(value) => `${value}%`" />
```

## Item clicks

Every chart exposes `onItemClick` through Vue's `@item-click` syntax. Interactive items support mouse clicks, Enter, and Space, and callback payloads retain the original data objects.

```vue
<LineChart :data="data" @item-click="openReport" />
```

Payloads reflect each chart's data model. See the chart-specific interaction sections:

- [Bar chart interactions](./bar.md#item-clicks)
- [Heatmap interactions](./heatmap.md#item-clicks)
- [Line chart interactions](./line.md#item-clicks)
- [Sankey interactions](./sankey.md#item-clicks)

## Theming

Data-level colors customize individual series, nodes, links, or cells. The `--cw-viz-*` custom properties documented in each chart guide control shared presentation. Raw CSS colors and `var(--token)` values are supported.

## Playground

```sh
pnpm install
pnpm dev
```

The Vite playground provides a gallery at `/` and editable stories at `/bar`, `/heatmap`, `/line`, and `/sankey`. Each story includes editable JSON, saved drafts, a resizable canvas, and its chart documentation.

## Development

The project requires Node.js 24.4.1 or newer and pnpm 10.2.0.

```sh
pnpm build         # Build the ESM library into dist/
pnpm test          # Run Vitest and Vue Test Utils tests
pnpm test:watch    # Run tests in watch mode
pnpm lint          # Check JavaScript and Vue script blocks with Oxlint
pnpm format        # Format supported files with Oxfmt
pnpm check         # Run all checks and the production build
pnpm analyze       # Generate bundle-report.html
```

## Packaging

Vite builds the library from `src/index.js`, emits modern ESM, and keeps Vue external. The playground is development-only and is not included in `dist`.
