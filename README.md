# @chatwoot/viz

Small, responsive chart components for Vue 3.5+. Built for Chatwoot with accessible interactions, rich HTML tooltips, and no runtime charting dependency.

## Install

```sh
pnpm add @chatwoot/viz
```

Import the stylesheet once, then import the charts you need:

```js
import '@chatwoot/viz/style.css'
```

```vue
<script setup>
import { LineChart } from '@chatwoot/viz'

const data = {
  categories: ['Week 1', 'Week 2', 'Week 3'],
  series: [{ id: 'resolved', label: 'Resolved', data: [12, 29, 23] }],
}
</script>

<template>
  <LineChart :data="data" aria-label="Resolved conversations by week" />
</template>
```

## Documentation

- [Overview and development](./playground/docs/index.md)
- [BarChart](./playground/docs/bar.md)
- [HeatmapChart](./playground/docs/heatmap.md)
- [LineChart](./playground/docs/line.md)
- [SankeyChart](./playground/docs/sankey.md)

## Playground

```sh
pnpm install
pnpm dev
```

Open `/` for the chart gallery or `/bar`, `/heatmap`, `/line`, and `/sankey` for editable stories.

## License

[MIT](./LICENSE)
